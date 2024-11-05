/*
 * encantar.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022-2024 Alexandre Martins <alemartf(at)gmail.com>
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
import { TrackerResult, TrackerOutput, Tracker } from '../tracker';
import { TrackablePointer, TrackablePointerPhase } from './trackable-pointer';
import { PointerSource } from '../../sources/pointer-source';
import { Vector2 } from '../../geometry/vector2';
import { Utils, Nullable } from '../../utils/utils';
import { IllegalOperationError } from '../../utils/errors';
import { Session } from '../../core/session';
import { Viewport } from '../../core/viewport';

/**
 * A result of a PointerTracker. It's meant to be consumed by the user/application
 */
export interface PointerTrackerResult extends TrackerResult
{
    /** the tracker that generated this result */
    readonly tracker: PointerTracker;

    /** the trackables */
    readonly trackables: TrackablePointer[];
}

/**
 * The output of a PointerTracker in a particular Frame of a Session
 */
export interface PointerTrackerOutput extends TrackerOutput
{
    /** tracker result to be consumed by the user */
    readonly exports: PointerTrackerResult;
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




/**
 * A tracker of pointer-based input such as mouse, touch or pen
 */
export class PointerTracker implements Tracker
{
    /** the source of data */
    private _source: Nullable<PointerSource>;

    /** the viewport */
    private _viewport: Nullable<Viewport>;

    /** active pointers */
    private _activePointers: Map<number, TrackablePointer>;

    /** new pointers */
    private _newPointers: Map<number, TrackablePointer>;

    /** previous output */
    private _previousOutput: PointerTrackerOutput;

    /** time of the previous update */
    private _previousUpdateTime: DOMHighResTimeStamp;



    /**
     * Constructor
     */
    constructor()
    {
        this._source = null;
        this._viewport = null;
        this._activePointers = new Map();
        this._newPointers = new Map();
        this._previousOutput = this._generateOutput();
        this._previousUpdateTime = Number.POSITIVE_INFINITY;
    }

    /**
     * The type of the tracker
     */
    get type(): string
    {
        return 'pointer-tracker';
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
            if(source._type == 'pointer-source') {
                this._source = source as PointerSource;
                break;
            }
        }

        if(this._source === null)
            return Speedy.Promise.reject(new IllegalOperationError('A PointerTracker expects a PointerSource'));

        // link the pointer source to the viewport
        this._source._setViewport(this._viewport);

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
        const inactiveTrackables = this._findUnwantedTrackables();
        for(let i = inactiveTrackables.length - 1; i >= 0; i--)
            this._activePointers.delete(inactiveTrackables[i].id);

        // make all active trackables stationary
        this._activePointers.forEach((trackable, id) => {
            this._activePointers.set(id, Object.assign({}, trackable, {
                phase: 'stationary'
            }));
        });

        // consume events
        let event: Nullable<PointerEvent>;
        while((event = this._source!._consume()) !== null) {

            // sanity check
            if(event.target !== canvas)
                return Speedy.Promise.reject(new IllegalOperationError('Invalid PointerEvent target ' + event.target));
            else if(!EVENTTYPE2PHASE.hasOwnProperty(event.type))
                return Speedy.Promise.reject(new IllegalOperationError('Invalid PointerEvent type ' + event.type));

            // determine the ID
            // XXX different hardware devices acting simultaneously may produce
            // events with the same pointerId - handling this seems overkill?
            const id = event.pointerId;

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
            }

            // determine the current position
            const absX = event.pageX - (rect.left + window.scrollX);
            const absY = event.pageY - (rect.top + window.scrollY);
            const relX = 2 * absX / rect.width - 1; // convert to [-1,1]
            const relY = -(2 * absY / rect.height - 1); // flip Y axis
            const position = new Vector2(relX, relY);

            // determine the position delta
            const deltaPosition = !previous ? Vector2.Zero() :
                                  position._clone()._subtract(previous.position);

            // determine the initial position
            const initialPosition = previous ? previous.initialPosition :
                                    Object.freeze(position._clone());

            // determine the velocity
            const velocity = deltaPosition._clone()._scale(inverseDeltaTime);

            // determine the elapsed time since the tracking began
            const elapsedTime = previous ? previous.elapsedTime + deltaTime : 0;

            // determine whether or not this is the primary pointer for this type
            const isPrimary = event.isPrimary;

            // determine the type of the originating device
            const kind = event.pointerType;

            // we create new trackable instances on each frame;
            // these will be exported and consumed by the user
            this._newPointers.set(id, { id, phase, position, deltaPosition, initialPosition, velocity, elapsedTime, isPrimary, kind });

        }

        // update trackables
        this._newPointers.forEach((trackable, id) => this._activePointers.set(id, trackable));
        this._newPointers.clear();

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
     * Generate tracker output
     * @returns a new PointerTrackerOutput object
     */
    private _generateOutput(): PointerTrackerOutput
    {
        const trackables: TrackablePointer[] = [];
        this._activePointers.forEach(trackable => trackables.push(trackable));

        return {
            exports: {
                tracker: this,
                trackables: this._sortTrackables(trackables)
            }
        };
    }

    /**
     * As a convenience, let's make sure that a primary pointer, if any exists,
     * is at the beginning of the trackables array
     * @param trackables
     * @returns sorted trackables
     */
    private _sortTrackables(trackables: TrackablePointer[]): TrackablePointer[]
    {
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
    private _findUnwantedTrackables(): TrackablePointer[]
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
