/*
 * encantar.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022-2025 Alexandre Martins <alemartf(at)gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * pointer-tracker.ts
 * Tracker of pointer-based input
 */

import Speedy from 'speedy-vision';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { TrackerResult, TrackerOutput, Tracker, TrackerType } from '../tracker';
import { TrackablePointer, TrackablePointerPhase } from './trackable-pointer';
import { PointerSource } from '../../sources/pointer-source';
import { Vector2 } from '../../geometry/vector2';
import { Utils, Nullable } from '../../utils/utils';
import { IllegalOperationError, IllegalArgumentError } from '../../utils/errors';
import { Session } from '../../core/session';
import { Viewport } from '../../core/viewport';

/**
 * A result of a PointerTracker. It's meant to be consumed by the user/application
 */
export class PointerTrackerResult extends TrackerResult
{
    /** the tracker that generated this result */
    readonly tracker: PointerTracker;

    /** the trackables */
    readonly trackables: TrackablePointer[];

    /**
     * Constructor
     * @param tracker
     * @param trackables
     */
    constructor(tracker: PointerTracker, trackables: TrackablePointer[])
    {
        super();
        this.tracker = tracker;
        this.trackables = trackables;
    }
}

/**
 * The output of a PointerTracker in a particular Frame of a Session
 */
export interface PointerTrackerOutput extends TrackerOutput
{
    /** tracker result to be consumed by the user */
    readonly exports: PointerTrackerResult;
}

/**
 * The space in which pointers are located.
 *
 * - In "normalized" space, pointers are located in [-1,1]x[-1,1]. The origin
 *   of the space is at the center of the viewport. The x-axis points to the
 *   right and the y-axis points up. This is the default space.
 *
 *   - Point (0,0) is at the center of the viewport
 *   - The top-right corner of the viewport is at (+1,+1)
 *   - The bottom-left corner of the viewport is at (-1,-1)
 *
 * - The "adjusted" space is similar to the normalized space, except that it is
 *   scaled so that it matches the aspect ratio of the viewport.
 *
 *   Pointers in adjusted space are contained in normalized space, but unless
 *   the viewport is a square, one of their coordinates, x or y, will no longer
 *   range from -1 to +1. It will range from -s to +s, where s = min(a, 1/a).
 *   In this expression, a is the aspect ratio of the viewport and s is less
 *   than or equal to 1.
 *
 *   Selecting the adjusted space is useful for making sure that pointer speeds
 *   are equivalent in both axes and for preserving movement curves. Speeds are
 *   not equivalent and movement curves are not preserved by default because
 *   the normalized space is a square, whereas the viewport is a rectangle.
 *
 *   In summary, prefer the adjusted space when working with velocities and
 *   movement curves.
 */
export type PointerSpace = 'normalized' | 'adjusted';

/**
 * Options for instantiating a PointerTracker
 */
export interface PointerTrackerOptions
{
    /** the space in which pointers will be located */
    space?: PointerSpace;
}

/** Convert event type to trackable pointer phase */
const EVENTTYPE2PHASE: Record<string, TrackablePointerPhase> = {
    'pointerdown': 'began',
    'pointerup': 'ended',
    'pointermove': 'moved',
    'pointercancel': 'canceled',
    'pointerleave': 'ended',
    'pointerenter': 'began',
};

/** Default options for instantiating a PointerTracker */
const DEFAULT_OPTIONS: Readonly<Required<PointerTrackerOptions>> = {
    space: 'normalized'
};




/**
 * A tracker of pointer-based input such as mouse, touch or pen
 */
export class PointerTracker implements Tracker
{
    /** the source of data */
    private _source: Nullable<PointerSource>;

    /** the viewport */
    private _viewport: Nullable<Viewport>;

    /** pointer space */
    private _space: PointerSpace;

    /** active pointers */
    private _activePointers: Map<number, TrackablePointer>;

    /** new pointers */
    private _newPointers: Map<number, TrackablePointer>;

    /** helper map for normalizing IDs */
    private _idMap: Map<number, number>;

    /** previous output */
    private _previousOutput: PointerTrackerOutput;

    /** time of the previous update */
    private _previousUpdateTime: DOMHighResTimeStamp;

    /** helper flag */
    private _wantToReset: boolean;

    /** auto-increment ID */
    private _nextId: number;






    /**
     * Constructor
     * @param options
     */
    constructor(options: PointerTrackerOptions)
    {
        const settings = this._buildSettings(options);

        this._source = null;
        this._viewport = null;
        this._space = settings.space;
        this._activePointers = new Map();
        this._newPointers = new Map();
        this._idMap = new Map();
        this._nextId = 1;
        this._previousOutput = this._generateOutput();
        this._previousUpdateTime = Number.POSITIVE_INFINITY;
        this._wantToReset = false;
        this._resetInTheNextUpdate = this._resetInTheNextUpdate.bind(this);
    }

    /**
     * Build a full and validated options object
     * @param options
     * @returns validated options with defaults
     */
    private _buildSettings(options: PointerTrackerOptions): Required<PointerTrackerOptions>
    {
        const settings: Required<PointerTrackerOptions> = Object.assign({}, DEFAULT_OPTIONS, options);

        if(settings.space != 'normalized' && settings.space != 'adjusted')
            throw new IllegalArgumentError(`Invalid pointer space: "${settings.space}"`);

        return settings;
    }

    /**
     * The type of the tracker
     * @deprecated
     */
    get type(): keyof TrackerType
    {
        return 'pointer-tracker';
    }

    /**
     * Check if this tracker is of a certain type
     */
    is<T extends keyof TrackerType>(type: T): this is TrackerType[T]
    {
        return type === this.type;
    }

    /**
     * Initialize the tracker
     * @param session
     * @returns a promise that is resolved as soon as the tracker is initialized
     * @internal
     */
    _init(session: Session): SpeedyPromise<void>
    {
        Utils.log('Initializing PointerTracker...');

        // set the viewport
        this._viewport = session.viewport;

        // find the pointer source
        for(const source of session.sources) {
            if(source._is('pointer-source')) {
                this._source = source;
                break;
            }
        }

        if(this._source === null)
            return Speedy.Promise.reject(new IllegalOperationError('A PointerTracker expects a PointerSource'));

        // link the pointer source to the viewport
        this._source._setViewport(this._viewport);

        // reset trackables
        document.addEventListener('visibilitychange', this._resetInTheNextUpdate);

        // done!
        return Speedy.Promise.resolve();
    }

    /**
     * Release the tracker
     * @returns a promise that is resolved as soon as the tracker is released
     * @internal
     */
    _release(): SpeedyPromise<void>
    {
        this._source = null;
        this._viewport = null;
        this._activePointers.clear();
        this._newPointers.clear();
        this._idMap.clear();

        document.removeEventListener('visibilitychange', this._resetInTheNextUpdate);

        return Speedy.Promise.resolve();
    }

    /**
     * Update the tracker (update cycle)
     * @returns a promise that is resolved as soon as the tracker is updated
     * @internal
     */
    _update(): SpeedyPromise<void>
    {
        const canvas = this._viewport!.canvas;
        const rect = canvas.getBoundingClientRect(); // may be different in different frames!

        // find the time between this and the previous update of this tracker
        const deltaTime = this._updateTime();
        const inverseDeltaTime = (deltaTime > 1e-5) ? 1 / deltaTime : 60; // 1/dt = 1 / (1/60) with 60 fps

        // remove inactive trackables from the previous frame (update cycle)
        const inactiveTrackables = this._findInactiveTrackables();
        for(let i = inactiveTrackables.length - 1; i >= 0; i--)
            this._activePointers.delete(inactiveTrackables[i].id);

        // make all active trackables stationary
        this._updateAllTrackables({
            phase: 'stationary',
            velocity: Vector2.ZERO,
            deltaPosition: Vector2.ZERO
        });

        // want to reset?
        if(this._wantToReset) {
            this._reset();
            this._wantToReset = false;
        }

        // consume events
        let event: Nullable<PointerEvent>;
        while((event = this._source!._consume()) !== null) {

            // sanity check
            if(event.target !== canvas)
                return Speedy.Promise.reject(new IllegalOperationError('Invalid PointerEvent target ' + event.target));
            else if(!EVENTTYPE2PHASE.hasOwnProperty(event.type))
                return Speedy.Promise.reject(new IllegalOperationError('Invalid PointerEvent type ' + event.type));

            // determine the ID
            const id = this._normalizeId(event.pointerId, event.pointerType);

            // determine the previous states, if any, of the trackable
            const previous = this._activePointers.get(id); // state in the previous frame
            const current = this._newPointers.get(id); // previous state in the current frame

            // determine the phase
            const phase = EVENTTYPE2PHASE[event.type];

            // new trackables always begin with a pointerdown event,
            // or with a pointerenter event having buttons pressed
            // (example: a mousemove without a previous mousedown isn't tracked)
            if(!(event.type == 'pointerdown' || (event.type == 'pointerenter' && event.buttons > 0))) {
                if(!previous && !current)
                    continue; // discard event
            }
            else if(previous) {
                // discard a 'began' after another 'began'
                continue;
            }
            else if(event.button != 0 && event.pointerType == 'mouse') {
                // require left mouse click
                continue;
            }

            // discard event if 'began' and 'ended' happened in the same frame
            // (difficult to reproduce, but it can be done ;)
            if(!previous) {
                if(phase == 'ended' || phase == 'canceled') {
                    this._newPointers.delete(id);
                    continue;
                }
            }

            // what if we receive 'began' after 'ended' in the same frame?
            else if(phase == 'began' && current) {
                if(current.phase == 'ended' || current.phase == 'canceled') {
                    this._newPointers.delete(id);
                    continue;
                }
            }

            // discard previously canceled pointers (e.g., with a visibilitychange event)
            if(previous?.phase == 'canceled')
                continue;

            // more special rules
            switch(event.type) {
                case 'pointermove':
                    if(event.buttons == 0 || current?.phase == 'began')
                        continue;
                    break;

                case 'pointerenter':
                    if(event.buttons == 0 || previous?.phase == 'began' || current?.phase == 'began')
                        continue;
                    break;

                case 'pointercancel': // purge everything
                    this._reset();
                    this._newPointers.clear();
                    continue;
            }

            // determine the current position in normalized space
            const absX = event.pageX - (rect.left + window.scrollX);
            const absY = event.pageY - (rect.top + window.scrollY);
            const relX = 2 * absX / rect.width - 1; // convert to [-1,1]
            const relY = -(2 * absY / rect.height - 1); // flip Y axis
            const position = new Vector2(relX, relY);

            // scale the normalized space so that it matches the aspect ratio of the viewport
            if(this._space == 'adjusted') {
                const a = this._viewport!.aspectRatio;

                if(a >= 1) {
                    // landscape
                    position._set(relX, relY / a);
                }
                else {
                    // portrait
                    position._set(relX * a, relY);
                }
            }

            // determine the position delta
            const deltaPosition = !previous ? Vector2.ZERO :
                                  position._clone()._subtract(previous.position);

            // determine the initial position
            const initialPosition = previous ? previous.initialPosition :
                                    Object.freeze(position._clone()) as Vector2;

            // determine the velocity
            const velocity = deltaPosition._clone()._scale(inverseDeltaTime);

            // determine the elapsed time since the tracking began
            const duration = previous ? previous.duration + deltaTime : 0;

            // determine how much this pointer has moved since its tracking began
            const movementLength = previous ? previous.movementLength + deltaPosition.length() : 0;

            // determine the duration of the movement
            const movementDuration = !previous ? 0 : previous.movementDuration + (movementLength > previous.movementLength ? deltaTime : 0);

            // determine whether or not this is the primary pointer for this type
            const isPrimary = event.isPrimary;

            // determine the type of the originating device
            const kind = event.pointerType;

            // we create new trackable instances on each frame;
            // these will be exported and consumed by the user
            this._newPointers.set(id, {
                id, phase,
                position, deltaPosition, initialPosition,
                velocity, duration,
                movementDuration, movementLength,
                isPrimary, kind,
                tracker: this
            });

        }

        // update trackables
        this._newPointers.forEach((trackable, id) => this._activePointers.set(id, trackable));
        this._newPointers.clear();
        this._advanceAllStationaryTrackables(deltaTime);

        // discard unused IDs
        if(this._activePointers.size == 0 && this._idMap.size > 0)
            this._idMap.clear();

        // generate output
        this._previousOutput = this._generateOutput();

        // test
        //console.log(JSON.stringify(this._prevOutput.exports.trackables, null, 4));

        // done!
        return Speedy.Promise.resolve();
    }

    /**
     * Output of the previous frame
     * @internal
     */
    get _output(): PointerTrackerOutput
    {
        return this._previousOutput;
    }

    /**
     * Stats info
     * @internal
     */
    get _stats(): string
    {
        const n = this._activePointers.size;
        const s = n != 1 ? 's' : '';

        return n + ' pointer' + s;
    }

    /**
     * The space in which pointers are located.
     * You may set it when instantiating the tracker.
     */
    get space(): PointerSpace
    {
        return this._space;
    }

    /**
     * Generate tracker output
     * @returns a new PointerTrackerOutput object
     */
    private _generateOutput(): PointerTrackerOutput
    {
        const trackables: TrackablePointer[] = [];
        this._activePointers.forEach(trackable => trackables.push(trackable));

        const result = new PointerTrackerResult(this, this._sortTrackables(trackables));
        return { exports: result };
    }

    /**
     * Update all active pointers
     * @param fields
     */
    private _updateAllTrackables(fields: Partial<TrackablePointer>): void
    {
        this._activePointers.forEach((trackable, id) => {
            this._activePointers.set(id, Object.assign({}, trackable, fields));
        });
    }

    /**
     * Advance the elapsed time of all stationary pointers
     * @param deltaTime
     */
    private _advanceAllStationaryTrackables(deltaTime: number): void
    {
        this._activePointers.forEach((trackable, id) => {
            if(trackable.phase == 'stationary') {
                (trackable as any).duration += deltaTime;
                /*
                this._activePointers.set(id, Object.assign({}, trackable, {
                    duration: trackable.duration + deltaTime
                }));
                */
            }
        });
    }

    /**
     * Normalize pointer IDs across browsers
     * @param pointerId browser-provided pointer ID
     * @param pointerType pointer type
     * @returns a normalized pointer ID
     */
    private _normalizeId(pointerId: number, pointerType: string): number
    {
        // XXX different hardware devices acting simultaneously may produce
        // events with the same pointerId - handling this seems overkill?
        if(pointerType == 'mouse')
            return 0;

        if(!this._idMap.has(pointerId))
            this._idMap.set(pointerId, this._nextId++);

        return this._idMap.get(pointerId)!;
    }

    /**
     * Cancel all active pointers and consume all events
     * @param deltaTime
     */
    private _reset(): void
    {
        // cancel all active pointers
        this._updateAllTrackables({
            phase: 'canceled',
            velocity: Vector2.ZERO,
            deltaPosition: Vector2.ZERO
        });

        // consume all events
        while(this._source!._consume() !== null);
    }

    /**
     * Reset in the next update of the tracker
     */
    private _resetInTheNextUpdate(): void
    {
        this._wantToReset = true;
    }

    /**
     * As a convenience, let's make sure that a primary pointer, if any exists,
     * is at the beginning of the trackables array
     * @param trackables
     * @returns sorted trackables
     */
    private _sortTrackables(trackables: TrackablePointer[]): TrackablePointer[]
    {
        /*

        Note: the browser may not report a new unique pointer (phase: "began")
        as primary. This logic makes trackables[0] primary, or sort of primary.

        Behavior on Chrome 130 on Android: when moving multiple touch points,
        remove focus from the browser. Touch points will be canceled as
        expected. When touching the screen again with a single finger, the
        (only one) registered pointer will not be primary. That's undesirable.
        Touching the screen again with multiple fingers (none will be primary),
        and then releasing them, will restore the desired behavior.

        */

        // nothing to do
        if(trackables.length <= 1 || trackables[0].isPrimary)
            return trackables;

        // find a primary pointer and swap
        for(let j = 1; j < trackables.length; j++) {
            if(trackables[j].isPrimary) {
                const primary = trackables[j];
                trackables[j] = trackables[0];
                trackables[0] = primary;
                break;
            }
        }

        // done!
        return trackables;
    }

    /**
     * Find trackables to remove
     * @returns a list of trackables to remove
     */
    private _findInactiveTrackables(): TrackablePointer[]
    {
        const trackables: TrackablePointer[] = [];

        this._activePointers.forEach(trackable => {
            if(trackable.phase == 'ended' || trackable.phase == 'canceled')
                trackables.push(trackable);
        });

        return trackables;
    }

    /**
     * Update the time
     * @returns delta time in seconds
     */
    private _updateTime(): DOMHighResTimeStamp
    {
        const now = performance.now() * 0.001;

        if(this._previousUpdateTime > now)
            this._previousUpdateTime = now;

        const prev = this._previousUpdateTime;
        this._previousUpdateTime = now;

        return now - prev;
    }
}
