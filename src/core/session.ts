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
 * session.ts
 * WebAR Session
 */

import Speedy from 'speedy-vision';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyMediaSourceNativeElement } from 'speedy-vision/types/core/speedy-media-source';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { AR } from '../main';
import { Nullable, Utils } from '../utils/utils';
import { AREvent, AREventTarget } from '../utils/ar-events';
import { IllegalArgumentError, IllegalOperationError, NotSupportedError, AccessDeniedError } from '../utils/errors';
import { Viewport } from './viewport';
import { Settings } from './settings';
import { Stats } from './stats';
import { Gizmos } from '../ui/gizmos';
import { Frame } from './frame';
import { Tracker } from '../trackers/tracker';
import { TimeManager } from './time-manager';
import { Source } from '../sources/source';
import { VideoSource } from '../sources/video-source';
import { CanvasSource } from '../sources/canvas-source';
import { asap } from '../utils/asap';

/** Session mode */
export type SessionMode = 'immersive' | 'inline';

/** Session options */
export interface SessionOptions
{
    /** session mode */
    mode?: SessionMode;

    /** trackers */
    trackers: Tracker[];

    /** sources of data */
    sources: Source[];

    /** viewport */
    viewport: Nullable<Viewport>;

    /** show stats? */
    stats?: boolean;

    /** Render gizmos? */
    gizmos?: boolean;
}

/** requestAnimationFrame callback */
type SessionRequestAnimationFrameCallback = (time: DOMHighResTimeStamp, frame: Frame) => void;

/** requestAnimationFrame callback handle */
type SessionRequestAnimationFrameHandle = symbol;

/** All possible event types emitted by a Session */
type SessionEventType = 'end';

/** An event emitted by a Session */
class SessionEvent extends AREvent<SessionEventType> { }

/** Default options when starting a session */
const DEFAULT_OPTIONS: Readonly<Required<SessionOptions>> = {
    mode: 'immersive',
    trackers: [],
    sources: [],
    viewport: null,
    stats: false,
    gizmos: false,
};



/**
 * A Session represents an intent to display AR content
 * and encapsulates the main loop (update-render cycle)
 */
export class Session extends AREventTarget<SessionEvent>
{
    /** Number of active sessions */
    private static _count = 0;

    /** Session mode */
    private readonly _mode: SessionMode;

    /** Attached trackers */
    private _trackers: Tracker[];

    /** Sources of data */
    private readonly _sources: Source[];

    /** Rendering viewport */
    private readonly _viewport: Viewport;

    /** Primary source of data */
    private readonly _primarySource: Nullable<VideoSource | CanvasSource>;

    /** Time Manager */
    private _time: TimeManager;

    /** Is the session currently active? */
    private _active: boolean;

    /** Whether or not the frame is ready to be rendered */
    private _frameReady: boolean;

    /** Request animation frame callback queue */
    private _rafQueue: Array<[SessionRequestAnimationFrameHandle, SessionRequestAnimationFrameCallback]>;

    /** Update stats (GPU cycles/s) */
    private _updateStats: Stats;

    /** Render stats (FPS) */
    private _renderStats: Stats;

    /** Gizmos */
    private _gizmos: Gizmos;



    /**
     * Constructor
     * @param sources previously initialized sources of data
     * @param mode session mode
     * @param viewport viewport
     * @param stats render stats panel?
     * @param gizmos render gizmos?
     */
    private constructor(sources: Source[], mode: SessionMode, viewport: Viewport, stats: boolean, gizmos: boolean)
    {
        super();

        this._mode = mode;
        this._trackers = [];
        this._sources = sources;
        this._updateStats = new Stats();
        this._renderStats = new Stats();
        this._active = true;
        this._frameReady = true; // no trackers at the moment
        this._rafQueue = [];
        this._time = new TimeManager();
        this._gizmos = new Gizmos();
        this._gizmos.visible = gizmos;

        // validate the mode
        if(mode != 'immersive' && mode != 'inline')
            throw new IllegalArgumentError(`Invalid session mode "${mode}"`);

        // find the primary source of data
        this._primarySource = this._findPrimarySource(sources);

        // setup the viewport
        this._viewport = viewport;
        if(this._primarySource !== null)
            this._viewport._init(() => this._primarySource!._internalMedia.size, mode, stats);
        else
            this._viewport._init(() => Utils.resolution('sm', window.innerWidth / window.innerHeight), mode, stats);

        // done!
        Session._count++;
        Utils.log(`The ${this._mode} session is now active!`);
    }

    /**
     * Checks if the engine can be run in the browser the client is using
     * @returns true if the engine is compatible with the browser
     */
    static isSupported(): boolean
    {
        //alert(Utils.deviceInfo()); // debug

        // If Safari / iOS, require version 15.2 or later
        if(/(Mac|iOS|iPhone|iPad|iPod)/i.test(Utils.platformString())) {

            /*

            iOS compatibility
            -----------------

            The engine is known to work on iPhone 8 or later, with iOS 15.2 or
            later. Tested on many devices, including iPads, on the cloud.

            The engine crashes on an iPhone 13 Pro Max with iOS 15.1 and on an
            iPhone 12 Pro with iOS 15.0.2. A (valid) shader from speedy-vision
            version 0.9.1 (bf-knn) fails to compile: "WebGL error. Program has
            not been successfully linked".

            The engine freezes on an older iPhone 6S (2015) with iOS 15.8.2.
            The exact cause is unknown, but it happens when training an image
            tracker, at ImageTrackerTrainingState._gpuUpdate() (a WebGL error?
            a hardware limitation?)

            Successfully tested down to iPhone 8 so far.
            Successfully tested down to iOS 15.2.

            >> WebGL2 support was introduced in Safari 15 <<

            Note: the webp image format used in the demos is supported on
            Safari for iOS 14+. Desktop Safari 14-15.6 supports webp, but
            requires macOS 11 Big Sur or later. https://caniuse.com/webp

            */

            const ios = /(iPhone|iPad|iPod).* (CPU[\s\w]* OS|CPU iPhone|iOS) ([\d\._]+)/.exec(navigator.userAgent); // Chrome, Firefox, Edge, Safari on iOS
            const safari = /(AppleWebKit)\/.* (Version)\/([\d\.]+)/.exec(navigator.userAgent); // Desktop and Mobile Safari, Epiphany on Linux
            const matches = safari || ios; // match safari first (min version)

            if(matches !== null) {
                const version = matches[3] || '0.0';
                const [x, y] = version.split(/[\._]/).map(v => parseInt(v) | 0);

                if((x < 15) || (x == 15 && y < 2)) {
                    Utils.error(`${matches === safari ? 'Safari' : 'iOS'} version ${version} is not supported! User agent: ${navigator.userAgent}`);
                    return false;
                }

                // XXX reject older iPhone models? Which ones?
                /*if(navigator.userAgent.includes('iPhone')) {
                    // detect screen size?
                }*/
            }
            else
                Utils.warning(`Unrecognized user agent: ${navigator.userAgent}`);
        }

        // Android: reject very old / weak devices?
        // XXX establish criteria?
        /*if(Utils.isAndroid()) {
        }*/

        // Check if WebGL2 and WebAssembly are supported
        return Speedy.isSupported();
    }

    /** 
     * Instantiate a session
     * @param options options
     * @returns a promise that resolves to a new session
     */
    static instantiate(options: SessionOptions = DEFAULT_OPTIONS): SpeedyPromise<Session>
    {
        const {
            mode = DEFAULT_OPTIONS.mode,
            sources = DEFAULT_OPTIONS.sources,
            trackers = DEFAULT_OPTIONS.trackers,
            viewport = DEFAULT_OPTIONS.viewport,
            stats = DEFAULT_OPTIONS.stats,
            gizmos = DEFAULT_OPTIONS.gizmos,
        } = options;

        Utils.log(`Starting a new ${mode} session...`);

        return Speedy.Promise.resolve().then(() => {

            // is the engine supported?
            if(!Session.isSupported())
                throw new NotSupportedError('You need a browser/device compatible with WebGL2 and WebAssembly in order to experience Augmented Reality with encantar.js');

            // block multiple sessions when requesting the immersive mode
            if(mode !== 'inline' && Session.count > 0)
                throw new IllegalOperationError(`Can't start multiple sessions, except in inline mode`);

            // dev build? work-in-progress
            const isStableBuild = /^\d+\.\d+(\.\d+)*$/.test(AR.version);
            if(!isStableBuild) {
                if(!(['localhost', '127.0.0.1', '[::1]', '', 'encantar.dev', 'alemart.github.io'].includes(location.hostname))) {
                    if(!(location.hostname.startsWith('192.168.') || location.hostname.startsWith('10.') || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(location.hostname))) {
                        const message = 'This is a development build (unstable). Do not use it in production. Get a stable release at encantar.dev';
                        Utils.warning(message);
                        if(!confirm(message + '\n\nAre you sure you want to continue?'))
                            throw new AccessDeniedError('Aborted');
                    }
                }
            }

            // initialize matrix routines
            return Speedy.Matrix.ready();

        }).then(() => {

            // validate sources of data
            for(let i = sources.length - 1; i >= 0; i--) {
                if(sources.indexOf(sources[i]) < i)
                    throw new IllegalArgumentError(`Found repeated sources of data`);
            }

            // initialize sources of data
            return Speedy.Promise.all(
                sources.map(source => source._init())
            );

        }).then(() => {

            // get the viewport
            if(!viewport)
                throw new IllegalArgumentError(`Can't create a session without a viewport`);

            // instantiate session
            return new Session(sources, mode, viewport, stats, gizmos);

        }).then(session => {

            // validate the trackers
            if(trackers.length == 0)
                Utils.warning(`No trackers have been attached to the session!`);

            for(let i = trackers.length - 1; i >= 0; i--) {
                if(trackers.indexOf(trackers[i]) < i)
                    throw new IllegalArgumentError(`Found repeated trackers`);
            }

            // attach the trackers
            return Speedy.Promise.all(
                trackers.map(tracker => session._attachTracker(tracker))
            ).then(() => session);

        }).then(session => {

            // start the main loop and return the session
            session._startMainLoop();
            return session;

        }).catch(err => {

            // log errors, if any
            Utils.error(`Can't start session: ${err.message}`);
            throw err;

        });
    }

    /**
     * Number of active sessions
     */
    static get count(): number
    {
        return this._count;
    }

    /**
     * End the session
     * @returns promise that resolves after the session is shut down
     */
    end(): SpeedyPromise<void>
    {
        // is the session inactive?
        if(!this._active)
            return Speedy.Promise.resolve();

        // deactivate the session
        Utils.log('Shutting down the session...');
        this._active = false; // set before wait()

        // wait a few ms, so that the GPU is no longer sending any data
        // then, release resources
        return Utils.wait(100).then(() => Speedy.Promise.all(

            // release trackers
            this._trackers.map(tracker => tracker._release())

        )).then(() => Speedy.Promise.all(

            // release input sources
            this._sources.map(source => source._release())

        )).then(() => {

            this._sources.length = 0;
            this._trackers.length = 0;

            // release internal components
            this._updateStats.reset();
            this._renderStats.reset();
            this._viewport._release();

            // end the session
            Session._count--;

            // dispatch event
            const event = new SessionEvent('end');
            this.dispatchEvent(event);

            // done!
            Utils.log('Session ended.');

        });
    }

    /**
     * Analogous to window.requestAnimationFrame()
     * @param callback
     * @returns a handle
     */
    requestAnimationFrame(callback: SessionRequestAnimationFrameCallback): SessionRequestAnimationFrameHandle
    {
        const handle: SessionRequestAnimationFrameHandle = Symbol('raf-handle');

        if(this._active) {
            this._rafQueue.push([ handle, callback ]);
        }
        else {
            // if the session is inactive, we simply ignore this call
            // this is friendly behavior, since RAF is used in animation loops
        }

        return handle;
    }

    /**
     * Analogous to window.cancelAnimationFrame()
     * @param handle a handle returned by this.requestAnimationFrame()
     */
    cancelAnimationFrame(handle: SessionRequestAnimationFrameHandle): void
    {
        for(let i = this._rafQueue.length - 1; i >= 0; i--) {
            if(this._rafQueue[i][0] === handle) {
                this._rafQueue.splice(i, 1);
                break;
            }
        }
    }

    /**
     * Session mode
     */
    get mode(): SessionMode
    {
        return this._mode;
    }

    /**
     * Whether or not the session has been ended
     */
    get ended(): boolean
    {
        return !this._active;
    }

    /**
     * Time Manager
     */
    get time(): TimeManager
    {
        return this._time;
    }

    /**
     * Visual cues for testing & debugging
     */
    get gizmos(): Gizmos
    {
        return this._gizmos;
    }

    /**
     * Rendering viewport
     */
    get viewport(): Viewport
    {
        return this._viewport;
    }

    /**
     * Attached trackers
     */
    get trackers(): Iterable<Tracker>
    {
        return this._trackers[Symbol.iterator]();
    }

    /**
     * Sources of data
     */
    get sources(): Iterable<Source>
    {
        return this._sources[Symbol.iterator]();
    }

    /**
     * Start the main loop
     */
    private _startMainLoop(): void
    {
        this._setupUpdateLoop();
        this._setupRenderLoop();

        Utils.log('The main loop has been started!');
    }

    /**
     * Find the primary source of data (generally a camera stream)
     * @param sources
     * @returns the primary source, or null if there isn't any
     */
    private _findPrimarySource(sources: Source[]): Nullable<VideoSource | CanvasSource>
    {
        // prefer video sources
        for(let i = 0; i < sources.length; i++) {
            if(sources[i]._type == 'video')
                return sources[i] as VideoSource;
        }
        for(let i = 0; i < sources.length; i++) {
            if(sources[i]._type == 'canvas')
                return sources[i] as CanvasSource;
        }

        // emit warning
        Utils.warning(`No primary source of data was found!`);
        return null;
    }

    /**
     * Attach a tracker to the session
     * @param tracker
     * @returns a promise that resolves as soon as the tracker is attached and initialized
     */
    private _attachTracker(tracker: Tracker): SpeedyPromise<void>
    {
        if(this._trackers.indexOf(tracker) >= 0)
            return Speedy.Promise.reject(new IllegalArgumentError(`Duplicate tracker attached to the session`));
        else if(!this._active)
            return Speedy.Promise.reject(new IllegalOperationError(`Inactive session`));

        this._trackers.push(tracker);
        return tracker._init(this);
    }

    /**
     * Render content to the background canvas
     */
    private _renderBackground(): void
    {
        const canvas = this._viewport._backgroundCanvas;
        const ctx = canvas.getContext('2d', { alpha: false });

        // error?
        if(!ctx)
            return;
        ctx.imageSmoothingEnabled = false;

        // render user media
        if(this._primarySource !== null) {
            const media = this._primarySource._internalMedia;
            this._renderMedia(ctx, media, true);
        }

        // render output image(s) for debugging
        for(let i = 0; i < this._trackers.length; i++) {
            const media = this._trackers[i]._output.image;
            if(media !== undefined)
                this._renderMedia(ctx, media, false);
        }

        // render gizmos
        this._gizmos._render(this._viewport, this._trackers);
    }

    /**
     * Render a SpeedyMedia
     * @param ctx rendering context
     * @param media
     * @param stretch
     */
    private _renderMedia(ctx: CanvasRenderingContext2D, media: SpeedyMedia, stretch: boolean): void
    {
        const canvas = ctx.canvas;
        const width = stretch ? canvas.width : media.width;
        const height = stretch ? canvas.height : media.height;

        if(media.type != 'data') {
            const image = media.source as Exclude<SpeedyMediaSourceNativeElement, ImageData>;
            ctx.drawImage(image, 0, 0, width, height);
        }
        else {
            const image = media.source as ImageData;
            ctx.putImageData(image, 0, 0, 0, 0, width, height);
        }
    }

    /**
     * Setup the update loop
     */
    private _setupUpdateLoop(): void
    {
        const scheduleNextFrame = () => {
            if(!this._active)
                return;
            else if(Settings.powerPreference == 'high-performance')
                asap(repeat);
            else
                window.requestAnimationFrame(repeat);
        };
        
        const update = () => {
            this._update().then(scheduleNextFrame).turbocharge();
        };

        function repeat() {
            if(Settings.powerPreference == 'low-power') // 30 fps
                window.requestAnimationFrame(update);
            else
                update();
        }

        window.requestAnimationFrame(update);
    }

    /**
     * The core of the update loop
     */
    private _update(): SpeedyPromise<void>
    {
        // active session?
        if(this._active) {
            return Speedy.Promise.all(
                // update trackers
                this._trackers.map(tracker => tracker._update().turbocharge())
            ).then(() => {
                // update internals
                this._updateStats.update();
                this._frameReady = true;
            }).catch(err => {
                // log error
                Utils.error('Tracking error: ' + err.toString(), err);

                // handle WebGL errors
                const cause = (err as any).cause;
                if(err.name == 'GLError') {
                    alert(err.message); // fatal error?
                    alert(Utils.deviceInfo()); // display useful info
                    throw err;
                }
                else if(typeof cause == 'object' && cause.name == 'GLError') {
                    alert(err.message);
                    alert(cause.message);
                    alert(Utils.deviceInfo());
                    throw err;
                }
            });
        }
        else {
            // inactive session
            this._updateStats.reset();
            return Speedy.Promise.resolve();
        }
    }

    /**
     * Setup the render loop
     */
    private _setupRenderLoop(): void
    {
        let skip = false, toggle = false;

        const render = (timestamp: DOMHighResTimeStamp) => {
            const enableFrameSkipping = (Settings.powerPreference == 'low-power');
            const highPerformance = (Settings.powerPreference == 'high-performance');

            // advance time
            this._time._update(timestamp);

            // skip frames
            if(!enableFrameSkipping || !(skip = !skip))
                this._render(timestamp);
                //this._render(timestamp, !enableFrameSkipping && !highPerformance && (toggle = !toggle));

            // repeat
            if(this._active)
                window.requestAnimationFrame(render);
        };

        window.requestAnimationFrame(render);
    }

    /**
     * Render a frame (RAF callback)
     * @param time current time, in ms
     * @param skipUserMedia skip copying the pixels of the user media to the background canvas in order to reduce the processing load (video stream is probably at 30fps?)
     */
    private _render(time: DOMHighResTimeStamp, skipUserMedia: boolean = false): void
    {
        // is the session active?
        if(this._active) {

            // are we ready to render a frame?
            if(this._frameReady) {

                // create a frame
                const results = this._trackers.map(tracker =>
                    tracker._output.exports || ({
                        tracker: tracker,
                        trackables: [],
                    })
                );
                const frame = new Frame(this, results);

                // clone & clear the RAF queue
                const rafQueue = this._rafQueue.slice(0);
                this._rafQueue.length = 0;

                // render content to the background canvas
                if(!skipUserMedia)
                    this._renderBackground();

                // render frame
                for(let i = 0; i < rafQueue.length; i++)
                    rafQueue[i][1].call(undefined, time, frame);

                // update internals
                this._renderStats.update();
                this._frameReady = false;

                // update stats panel
                const statsPanel = this._viewport.hud._statsPanel;
                statsPanel.update(time, this._sources, this._trackers, this._viewport, this._updateStats.cyclesPerSecond, this._renderStats.cyclesPerSecond);

            }
            else {

                // skip frame
                ;

                // we'll update the renderStats even if we skip the frame,
                // otherwise this becomes updateStats! (approximately)
                // This is a window.requestAnimationFrame() call, so the
                // browser is rendering content even if we're not.
                this._renderStats.update();

            }

        }
        else {

            // inactive session
            this._renderStats.reset();

        }
    }
}
