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
 * viewport.ts
 * Viewport
 */

import { AR } from '../main';
import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { SessionMode } from './session';
import { HUD, HUDContainer } from './hud';
import { Vector2 } from '../geometry/vector2';
import { Resolution } from '../utils/resolution';
import { Nullable } from '../utils/utils';
import { Utils } from '../utils/utils';
import { AREvent, AREventTarget } from '../utils/ar-events';
import { IllegalArgumentError, IllegalOperationError, NotSupportedError, AccessDeniedError } from '../utils/errors';




/** Viewport container */
export type ViewportContainer = HTMLDivElement;

/** We admit that the size of the drawing buffer of the background canvas of the viewport may change over time */
type ViewportSizeGetter = () => SpeedySize;

/** All possible event types emitted by a Viewport */
type ViewportEventType = 'resize' | 'fullscreenchange';

/** An event emitted by a Viewport */
export class ViewportEvent extends AREvent<ViewportEventType> { }

/** Viewport style (immersive mode) */
export type ViewportStyle = 'best-fit' | 'stretch' | 'crop' | 'inline';




/**
 * Viewport constructor settings
 */
export interface ViewportSettings
{
    /** Viewport container */
    container: Nullable<ViewportContainer>;

    /** HUD container */
    hudContainer?: Nullable<HUDContainer>;

    /** Resolution of the canvas on which the virtual scene will be drawn */
    resolution?: Resolution;

    /** Viewport style */
    style?: ViewportStyle;

    /** An existing <canvas> on which the virtual scene will be drawn */
    canvas?: Nullable<HTMLCanvasElement>;

    /** Whether or not to include the built-in fullscreen button */
    fullscreenUI?: boolean;

    /** Whether or not to display the encantar.js watermark */
    watermark?: boolean;
}

/** Default viewport constructor settings */
const DEFAULT_VIEWPORT_SETTINGS: Readonly<Required<ViewportSettings>> = {
    container: null,
    hudContainer: null,
    resolution: 'lg',
    style: 'best-fit',
    canvas: null,
    fullscreenUI: true,
    watermark: true,
};




/** Base z-index of the children of the viewport container */
const BASE_ZINDEX = 0;

/** Z-index of the background canvas */
const BACKGROUND_ZINDEX = BASE_ZINDEX + 0;

/** Z-index of the foreground canvas */
const FOREGROUND_ZINDEX = BASE_ZINDEX + 1;

/** Z-index of the HUD */
const HUD_ZINDEX = BASE_ZINDEX + 2;

/** Time in ms used to throttle the resize callback of the window */
const RESIZE_THROTTLE_DELAY = 100;

/** Duration in ms of the polling after a change of orientation */
const ORIENTATION_POLLING_DURATION = 500; // 500 ms for iOS

/** Number of cycles of the polling */
const ORIENTATION_POLLING_CYCLES = 5; // the more cycles, the quicker a cycle is




/**
 * Helper class to work with the containers of the viewport
 */
class ViewportContainers
{
    /** The viewport container */
    private readonly _container: ViewportContainer;

    /** A direct child of the viewport container */
    private readonly _subContainer: HTMLDivElement;




    /**
     * Constructor
     * @param container viewport container
     */
    constructor(container: Nullable<ViewportContainer>)
    {
        // validate
        if(container == null)
            throw new IllegalArgumentError('Unspecified viewport container');
        else if(!(container instanceof HTMLElement))
            throw new IllegalArgumentError('Invalid viewport container');

        // store the viewport container
        this._container = container;

        // create the sub-container
        this._subContainer = document.createElement('div') as HTMLDivElement;
        container.appendChild(this._subContainer);
    }

    /**
     * The viewport container
     */
    get container(): ViewportContainer
    {
        return this._container;
    }

    /**
     * The sub-container
     */
    get subContainer(): HTMLDivElement
    {
        return this._subContainer;
    }

    /**
     * Initialize
     */
    init(): void
    {
        this._container.style.touchAction = 'none';
        this._container.style.backgroundColor = 'black';
    }

    /**
     * Release
     */
    release(): void
    {
        this._container.style.removeProperty('background-color');
        this._container.style.removeProperty('touch-action');
    }
}




/**
 * Helper class to work with the canvases of the viewport
 */
class ViewportCanvases
{
    /** A canvas used to render the physical scene */
    private readonly _backgroundCanvas: HTMLCanvasElement;

    /** A canvas used to render the virtual scene */
    private readonly _foregroundCanvas: HTMLCanvasElement;

    /** Original CSS of the foreground canvas */
    private readonly _originalCSSTextOfForegroundCanvas: string;



    /**
     * Constructor
     * @param parent container for the canvases
     * @param initialSize initial size of the canvases
     * @param fgCanvas optional existing foreground canvas
     */
    constructor(parent: HTMLElement, initialSize: SpeedySize, fgCanvas: Nullable<HTMLCanvasElement> = null)
    {
        if(fgCanvas !== null && !(fgCanvas instanceof HTMLCanvasElement))
            throw new IllegalArgumentError('Not a canvas: ' + fgCanvas);

        this._originalCSSTextOfForegroundCanvas = fgCanvas ? fgCanvas.style.cssText : '';

        this._foregroundCanvas = this._styleCanvas(
            fgCanvas || this._createCanvas(initialSize),
            FOREGROUND_ZINDEX
        );

        this._foregroundCanvas.style.background = 'transparent';

        this._backgroundCanvas = this._styleCanvas(
            this._createCanvas(initialSize),
            BACKGROUND_ZINDEX
        );

        this._backgroundCanvas.hidden = true;
        this._foregroundCanvas.hidden = true;

        const engineInfo = 'encantar.js ' + AR.version;
        this._backgroundCanvas.dataset.arEngine = engineInfo;
        this._foregroundCanvas.dataset.arEngine = engineInfo;

        parent.appendChild(this._backgroundCanvas);
        parent.appendChild(this._foregroundCanvas);
    }

    /**
     * The background canvas
     */
    get backgroundCanvas(): HTMLCanvasElement
    {
        return this._backgroundCanvas;
    }

    /**
     * The foreground canvas
     */
    get foregroundCanvas(): HTMLCanvasElement
    {
        return this._foregroundCanvas;
    }

    /**
     * Initialize
     */
    init(): void
    {
        this._backgroundCanvas.hidden = false;
        this._foregroundCanvas.hidden = false;
    }

    /**
     * Release
     */
    release(): void
    {
        this._backgroundCanvas.hidden = true;
        this._foregroundCanvas.hidden = true;

        this._backgroundCanvas.style.cssText = '';
        this._foregroundCanvas.style.cssText = this._originalCSSTextOfForegroundCanvas;
    }

    /**
     * Create a canvas
     * @param size size of the drawing buffer
     * @returns a new canvas
     */
    private _createCanvas(size: SpeedySize): HTMLCanvasElement
    {
        const canvas = document.createElement('canvas') as HTMLCanvasElement;

        canvas.width = size.width;
        canvas.height = size.height;

        return canvas;
    }

    /**
     * Add suitable CSS rules to a canvas
     * @param canvas
     * @param zIndex
     * @returns canvas
     */
    private _styleCanvas(canvas: HTMLCanvasElement, zIndex: number): HTMLCanvasElement
    {
        canvas.style.position = 'absolute';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = String(zIndex);
        canvas.style.objectFit = 'unset';

        return canvas;
    }
}




/**
 * Fullscreen utilities
 */
class ViewportFullscreenHelper
{
    /** The viewport */
    private readonly _viewport: Viewport;

    /** The container to be put in fullscreen */
    private readonly _container: HTMLElement;

    /** Event handler */
    private _boundEventHandler: EventListener;



    /**
     * Constructor
     * @param viewport Viewport
     */
    constructor(viewport: Viewport)
    {
        this._viewport = viewport;
        this._container = viewport.container;
        this._boundEventHandler = this._triggerEvent.bind(this);
    }

    /**
     * Initialize
     */
    init(): void
    {
        this._container.addEventListener('fullscreenchange', this._boundEventHandler);
    }

    /**
     * Release
     */
    release(): void
    {
        this._container.removeEventListener('fullscreenchange', this._boundEventHandler);
    }

    /**
     * Make a request to the user agent so that the viewport container is
     * displayed in fullscreen mode. The container must be a compatible element[1]
     * and the user must interact with the page in order to comply with browser
     * policies[2]. In case of error, the returned promise is rejected.
     * [1] https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen#compatible_elements
     * [2] https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen#security
     * @returns promise
     */
    request(): SpeedyPromise<void>
    {
        const container = this._container;

        // fallback for older WebKit versions
        if(container.requestFullscreen === undefined) {
            if((container as any).webkitRequestFullscreen === undefined)
                return Speedy.Promise.reject(new NotSupportedError());
            else if(!(document as any).webkitFullscreenEnabled)
                return Speedy.Promise.reject(new AccessDeniedError());

            // webkitRequestFullscreen() does not return a value
            (container as any).webkitRequestFullscreen();

            return new Speedy.Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    if(container === (document as any).webkitFullscreenElement) {
                        Utils.log('Entering fullscreen mode...');
                        resolve();
                    }
                    else
                        reject(new TypeError());
                }, 100);
            });
        }

        // check if the fullscreen mode is available
        if(!document.fullscreenEnabled)
            return Speedy.Promise.reject(new AccessDeniedError());

        // request fullscreen
        return new Speedy.Promise<void>((resolve, reject) => {
            container.requestFullscreen({
                navigationUI: 'hide'
            }).then(() => {
                Utils.log('Entering fullscreen mode...');
                resolve();
            }, reject);
        });
    }

    /**
     * Exit fullscreen mode
     * @returns promise
     */
    exit(): SpeedyPromise<void>
    {
        // fallback for older WebKit versions
        if(document.exitFullscreen === undefined) {
            const doc = document as any;

            if(doc.webkitExitFullscreen === undefined)
                return Speedy.Promise.reject(new NotSupportedError());
            else if(doc.webkitFullscreenElement === null)
                return Speedy.Promise.reject(new IllegalOperationError('Not in fullscreen mode'));

            // webkitExitFullscreen() does not return a value
            doc.webkitExitFullscreen();

            return new Speedy.Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    if(doc.webkitFullscreenElement === null) {
                        Utils.log('Exiting fullscreen mode...');
                        resolve();
                    }
                    else
                        reject(new TypeError());
                }, 100);
            });
        }

        // error if not in fullscreen mode
        if(document.fullscreenElement === null)
            return Speedy.Promise.reject(new IllegalOperationError('Not in fullscreen mode'));

        // exit fullscreen
        return new Speedy.Promise<void>((resolve, reject) => {
            document.exitFullscreen().then(() => {
                Utils.log('Exiting fullscreen mode...');
                resolve();
            }, reject);
        });
    }

    /**
     * Is the fullscreen mode available in this platform?
     * @returns true if the fullscreen mode is available in this platform
     */
    isAvailable(): boolean
    {
        return document.fullscreenEnabled ||
               !!((document as any).webkitFullscreenEnabled);
    }

    /**
     * Is the container currently being displayed in fullscreen mode?
     * @returns true if the container is currently being displayed in fullscreen mode
     */
    isActivated(): boolean
    {
        if(document.fullscreenElement !== undefined)
            return document.fullscreenElement === this._container;
        else if((document as any).webkitFullscreenElement !== undefined)
            return (document as any).webkitFullscreenElement === this._container;
        else
            return false;
    }

    /**
     * Trigger a fullscreenchange event
     */
    _triggerEvent(): void
    {
        const event = new ViewportEvent('fullscreenchange');
        this._viewport.dispatchEvent(event);
    }
}




/**
 * Helper class to resize the viewport
 */
class ViewportResizer
{
    /** the viewport to be resized */
    private readonly _viewport: Viewport;

    /** a timer used for throttling */
    private _throttleTimer: Nullable<ReturnType<typeof setTimeout>>;

    /** resize strategy */
    private _resizeStrategy: ViewportResizeStrategy;




    /**
     * Constructor
     * @param viewport the viewport to be resized
     */
    constructor(viewport: Viewport)
    {
        this._viewport = viewport;
        this._throttleTimer = null;
        this._onViewportResize = this._onViewportResize.bind(this);
        this._onWindowResize = this._onWindowResize.bind(this);
        this._onOrientationChange = this._onOrientationChange.bind(this);
        this._resizeStrategy = new InlineResizeStrategy();

        // initial setup
        // (the size is yet unknown)
        this._viewport.addEventListener('resize', this._onViewportResize);
        this._triggerResizeEvent();
    }

    /**
     * Initialize
     */
    init(): void
    {
        // Configure the resize listener. We want the viewport to adjust itself
        // if the phone/screen is resized or changes orientation
        window.addEventListener('resize', this._onWindowResize);

        // handle changes of orientation
        if(typeof screen.orientation === 'object')
            screen.orientation.addEventListener('change', this._onOrientationChange);
        else
            window.addEventListener('orientationchange', this._onOrientationChange); // deprecated

        // trigger a resize to setup the sizes / the CSS
        this._triggerResizeEvent();
    }

    /**
     * Release
     */
    release(): void
    {
        if(typeof screen.orientation === 'object')
            screen.orientation.removeEventListener('change', this._onOrientationChange);
        else
            window.removeEventListener('orientationchange', this._onOrientationChange);

        window.removeEventListener('resize', this._onWindowResize);

        this._viewport.removeEventListener('resize', this._onViewportResize);
        this._resizeStrategy.clear(this._viewport);
    }

    /**
     * Change the resize strategy
     * @param strategy new strategy
     */
    setStrategy(strategy: ViewportResizeStrategy): void
    {
        this._resizeStrategy.clear(this._viewport);
        this._resizeStrategy = strategy;
        this._triggerResizeEvent();
    }

    /**
     * Change the resize strategy
     * @param strategyName name of the new strategy
     */
    setStrategyByName(strategyName: ViewportStyle): void
    {
        switch(strategyName) {
            case 'best-fit':
                this.setStrategy(new BestFitResizeStrategy());
                break;

            case 'stretch':
                this.setStrategy(new StretchResizeStrategy());
                break;

            case 'crop':
                this.setStrategy(new CropResizeStrategy());
                break;

            case 'inline':
                this.setStrategy(new InlineResizeStrategy());
                break;

            default:
                throw new IllegalArgumentError('Invalid viewport style: ' + strategyName);
        }
    }

    /**
     * Trigger a resize event
     */
    private _triggerResizeEvent(): void
    {
        const event = new ViewportEvent('resize');
        this._viewport.dispatchEvent(event);
    }

    /**
     * Called when the window receives a 'resize' event
     */
    private _onWindowResize(): void
    {
        // throttle the resize callback
        if(this._throttleTimer !== null)
            clearTimeout(this._throttleTimer);

        this._throttleTimer = setTimeout(() => {
            this._throttleTimer = null;
            this._triggerResizeEvent();
        }, RESIZE_THROTTLE_DELAY);
    }

    /**
     * Called when a change of device orientation is detected
     */
    private async _onOrientationChange(): Promise<void>
    {
        /*

        When changing the orientation of a mobile device, sometimes there will
        be a mismatch between the viewport and the screen: one will be in
        landscape mode and the other in portrait mode.

        Ultimately, the size of the viewport is dependent on the size of the
        underlying media (typically a camera feed). When the device is rotated,
        the browser should rotate the camera feed automatically[1]. In addition,
        it will trigger a resize event on the window, which will, in time,
        resize the viewport. If the order of events is such that the viewport
        is resized before the camera feed is rotated, then we will observe a
        distorted video.

        Let's correct the issue by first detecting the situation and then by
        triggering a new resize event.

        [1] at the time of this writing, when testing on Android devices, I see
            that Chrome does it. Firefox 139 does it in one device but doesn't
            do it in another (it's a browser bug - see below). Safari/iOS does
            it (tested on the cloud).

            https://bugzilla.mozilla.org/show_bug.cgi?id=1802849

        */

        const canvas = this._viewport._backgroundCanvas;

        // this is polling
        for(let i = 0; i < ORIENTATION_POLLING_CYCLES; i++) {

            await Utils.wait(ORIENTATION_POLLING_DURATION / ORIENTATION_POLLING_CYCLES);

            // After the camera feed is rotated, this._viewport.aspectRatio will
            // be correct, but the canvas will not reflect that if, instants ago,
            // it was resized using the previous aspect ratio of the media.
            const a = canvas.width / canvas.height;
            const b = this._aspectRatioOfScreen();

            // if there is a mismatch between the aspect ratios, then the last
            // resize of the viewport took place with the previous aspect ratio
            // of the media. This means that canvas is now incorrectly sized,
            // and that the previous viewport resize event was ineffective.
            if((a-1) * (b-1) < 0) { //if((a < 1 && b > 1) || (a > 1 && b < 1))
                this._triggerResizeEvent();
                //break; // keep listening; see [2]
            }

            // Note: when using a canvas or a video file as a source of data,
            // its aspect ratio is not expected to change. We will trigger
            // additional resize events on mobile in this case. Unlikely to be
            // an issue.

        }

        /*

        [2] is this order of events possible when changing the orientation?

        1. orientationchange event is fired and handled
        2. resize event is fired and handled
        3. camera feed is rotated

        If so, increasing the throttling will likely make the camera feed be
        rotated first, but then the user will more easily notice the delay.
        Increasing the polling time is a simple alternative that makes this
        callback be executed after the video rotation, which is what we want.
        About listening to video resize: the Viewport doesn't know about it
        and has no access to the source of data. The Session does, however.

        */
    }

    /**
     * Called when the viewport receives a 'resize' event
     * @param event
     */
    private _onViewportResize(event: ViewportEvent): void
    {
        const viewport = this._viewport;

        // Resize the drawing buffer of the foreground canvas, so that it
        // matches the desired resolution, as well as the aspect ratio of the
        // background canvas
        const foregroundCanvas = viewport.canvas;
        const virtualSize = viewport.virtualSize;
        foregroundCanvas.width = virtualSize.width;
        foregroundCanvas.height = virtualSize.height;

        // Resize the drawing buffer of the background canvas
        const backgroundCanvas = viewport._backgroundCanvas;
        const realSize = viewport._realSize;
        backgroundCanvas.width = realSize.width;
        backgroundCanvas.height = realSize.height;

        // Call strategy
        this._resizeStrategy.resize(viewport);
    }

    /**
     * The current aspect ratio of the screen
     * @returns a value greater than 1 if the device is in landscape mode
     */
    private _aspectRatioOfScreen(): number
    {
        // When changing the orientation of a mobile device, screen.width and
        // screen.height are flipped on Chrome and on Firefox, but not on Safari
        //return screen.width / screen.height;

        // These are the width and the height of the screen in landscape mode
        const width = Math.max(screen.width, screen.height);
        const height = Math.min(screen.width, screen.height);

        // use screen.orientation if possible
        if(typeof screen.orientation === 'object') {
            if(screen.orientation.type.startsWith('landscape'))
                return width / height;
            else
                return height / width;
        }

        // fallback for older iOS
        // https://developer.apple.com/documentation/webkitjs/domwindow/1632568-orientation
        if(typeof window.orientation === 'number') {
            if(Math.abs(window.orientation) == 90)
                return width / height;
            else
                return height / width;
        }

        // general fallback
        // note: before evaluating clientWidth & clientHeight, a setTimeout(fn,
        // t >= 100?) is necessary immediately after a change of orientation.
        // mobile devices should not fall in this case, so no worries.
        if(document.documentElement.clientWidth > document.documentElement.clientHeight)
            return width / height;
        else
            return height / width;
    }
}




/**
 * Resize strategies
 */
abstract class ViewportResizeStrategy
{
    /**
     * Resize the viewport
     * @param viewport
     */
    abstract resize(viewport: Viewport): void;

    /**
     * Clear CSS rules
     * @param viewport
     */
    clear(viewport: Viewport): void
    {
        viewport.container.style.cssText = '';
        viewport._subContainer.style.cssText = '';
        viewport._backgroundCanvas.style.objectFit = 'unset';
        viewport.canvas.style.objectFit = 'unset';
    }
}

/**
 * Inline viewport: it follows the typical flow of a web page
 */
class InlineResizeStrategy extends ViewportResizeStrategy
{
    /**
     * Resize the viewport
     * @param viewport
     */
    resize(viewport: Viewport): void
    {
        const container = viewport.container;
        const subContainer = viewport._subContainer;
        const virtualSize = viewport.virtualSize;

        container.style.display = 'inline-block'; // fixes a potential issue of the viewport not showing up
        container.style.position = 'relative';
        container.style.left = '0px';
        container.style.top = '0px';
        container.style.width = virtualSize.width + 'px';
        container.style.height = virtualSize.height + 'px';

        subContainer.style.position = 'absolute';
        subContainer.style.left = '0px';
        subContainer.style.top = '0px';
        subContainer.style.width = '100%';
        subContainer.style.height = '100%';
    }
}

/**
 * Immersive viewport: it occupies the entire page
 */
abstract class ImmersiveResizeStrategy extends ViewportResizeStrategy
{
    /**
     * Resize the viewport
     * @param viewport
     */
    resize(viewport: Viewport): void
    {
        const CONTAINER_ZINDEX = 1000000000;
        const container = viewport.container;

        container.style.position = 'fixed';
        container.style.left = '0px';
        container.style.top = '0px';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.zIndex = String(CONTAINER_ZINDEX);
    }
}

/**
 * Immersive viewport with best-fit style: it preserves the aspect ratio of the
 * media. This is also known as letterboxing or pillarboxing
 */
class BestFitResizeStrategy extends ImmersiveResizeStrategy
{
    /**
     * Resize the viewport
     * @param viewport
     */
    resize(viewport: Viewport): void
    {
        const subContainer = viewport._subContainer;
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        const viewportAspectRatio = viewport.aspectRatio;
        let width = 1, height = 1, left = '0px', top = '0px';

        if(viewportAspectRatio <= windowAspectRatio) {
            height = window.innerHeight;
            width = Math.round(height * viewportAspectRatio);
            width -= width % 2;
            left = `calc(50% - ${width >>> 1}px)`;
        }
        else {
            width = window.innerWidth;
            height = Math.round(width / viewportAspectRatio);
            height -= height % 2;
            top = `calc(50% - ${height >>> 1}px)`;
        }

        subContainer.style.position = 'absolute';
        subContainer.style.left = left;
        subContainer.style.top = top;
        subContainer.style.width = width + 'px';
        subContainer.style.height = height + 'px';

        super.resize(viewport);
    }
}

/**
 * Immersive viewport with stretch style: it fully fills the viewport with the
 * media, possibly distorting it
 */
class StretchResizeStrategy extends ImmersiveResizeStrategy
{
    /**
     * Resize the viewport
     * @param viewport
     */
    resize(viewport: Viewport): void
    {
        const subContainer = viewport._subContainer;

        subContainer.style.position = 'absolute';
        subContainer.style.left = '0px';
        subContainer.style.top = '0px';
        subContainer.style.width = window.innerWidth + 'px';
        subContainer.style.height = window.innerHeight + 'px';

        super.resize(viewport);
    }
}

/**
 * Immersive viewport with crop style: it fully fills the viewport with the
 * media, possibly cropping and scaling it to maintain its aspect ratio
 */
class CropResizeStrategy extends ImmersiveResizeStrategy
{
    /**
     * Resize the viewport
     * @param viewport
     */
    resize(viewport: Viewport): void
    {
        const subContainer = viewport._subContainer;
        const backgroundCanvas = viewport._backgroundCanvas;
        const foregroundCanvas = viewport.canvas;

        subContainer.style.position = 'absolute';
        subContainer.style.left = '0px';
        subContainer.style.top = '0px';
        subContainer.style.width = window.innerWidth + 'px';
        subContainer.style.height = window.innerHeight + 'px';

        backgroundCanvas.style.objectFit = 'cover';
        foregroundCanvas.style.objectFit = 'cover';

        super.resize(viewport);
    }
}




/**
 * Viewport
 */
export class Viewport extends AREventTarget<ViewportEvent>
{
    /** Viewport resolution (controls the size of the drawing buffer of the foreground canvas) */
    private readonly _resolution: Resolution;

    /** Viewport settings */
    private readonly _settings: Readonly<Required<ViewportSettings>>

    /** The containers */
    private readonly _containers: ViewportContainers;

    /** An overlay displayed in front of the augmented scene */
    private readonly _hud: HUD;

    /** Viewport style */
    private _style: ViewportStyle;

    /** The canvases of the viewport */
    private readonly _canvases: ViewportCanvases;

    /** Resize helper */
    private readonly _resizer: ViewportResizer;

    /** The current size of the underlying SpeedyMedia */
    private _mediaSize: ViewportSizeGetter;

    /** Fullscreen utilities */
    private readonly _fullscreen: ViewportFullscreenHelper;





    /**
     * Constructor
     * @param viewportSettings
     */
    constructor(viewportSettings: ViewportSettings)
    {
        super();

        const settings = Object.assign({}, DEFAULT_VIEWPORT_SETTINGS, viewportSettings);
        this._settings = Object.freeze(settings);

        const guessedAspectRatio = window.innerWidth / window.innerHeight;
        const initialSize = Utils.resolution(settings.resolution, guessedAspectRatio);
        this._mediaSize = () => initialSize;

        this._resolution = settings.resolution;
        this._style = settings.style;

        this._containers = new ViewportContainers(settings.container);
        this._hud = new HUD(this, this._subContainer, settings.hudContainer);
        this._canvases = new ViewportCanvases(this._subContainer, initialSize, settings.canvas);

        this._resizer = new ViewportResizer(this);
        this._resizer.setStrategyByName(this._style);

        this._fullscreen = new ViewportFullscreenHelper(this);
    }

    /**
     * Viewport container
     */
    get container(): ViewportContainer
    {
        return this._containers.container;
    }

    /**
     * Viewport style
     */
    get style(): ViewportStyle
    {
        return this._style;
    }

    /**
     * HUD
     */
    get hud(): HUD
    {
        return this._hud;
    }

    /**
     * Resolution of the virtual scene
     */
    get resolution(): Resolution
    {
        return this._resolution;
    }

    /**
     * Size in pixels of the drawing buffer of the canvas
     * on which the virtual scene will be drawn
     */
    get virtualSize(): SpeedySize
    {
        return Utils.resolution(this._resolution, this.aspectRatio);
    }

    /**
     * Aspect ratio of the viewport
     */
    get aspectRatio(): number
    {
        const size = this._realSize;
        return size.width / size.height;
    }

    /**
     * Is the viewport currently being displayed in fullscreen mode?
     */
    get fullscreen(): boolean
    {
        return this._fullscreen.isActivated();
    }

    /**
     * Is the fullscreen mode available in this platform?
     */
    get fullscreenAvailable(): boolean
    {
        return this._fullscreen.isAvailable();
    }

    /**
     * The canvas on which the virtual scene will be drawn
     */
    get canvas(): HTMLCanvasElement
    {
        return this._canvases.foregroundCanvas;
    }

    /**
     * The canvas on which the physical scene will be drawn
     * @internal
     */
    get _backgroundCanvas(): HTMLCanvasElement
    {
        return this._canvases.backgroundCanvas;
    }

    /**
     * Size of the drawing buffer of the background canvas, in pixels
     * @internal
     */
    get _realSize(): SpeedySize
    {
        return this._mediaSize();
    }

    /**
     * Sub-container of the viewport container
     * @internal
     */
    get _subContainer(): HTMLDivElement
    {
        return this._containers.subContainer;
    }

    /**
     * Request fullscreen mode
     * @returns promise
     */
    requestFullscreen(): SpeedyPromise<void>
    {
        return this._fullscreen.request();
    }

    /**
     * Exit fullscreen mode
     * @returns promise
     */
    exitFullscreen(): SpeedyPromise<void>
    {
        return this._fullscreen.exit();
    }

    /**
     * Convert a position given in space units to a corresponding pixel
     * position in canvas space. Units in normalized space range from -1 to +1.
     * The center of the canvas is at (0,0). The top right corner is at (1,1).
     * The bottom left corner is at (-1,-1).
     * @param position in space units
     * @param space either "normalized" (default) or "adjusted"; @see PointerSpace
     * @returns an equivalent pixel position in canvas space
     */
    convertToPixels(position: Vector2, space: "normalized" | "adjusted" = 'normalized'): Vector2
    {
        const canvas = this.canvas;
        let px = position.x, py = position.y;

        if(space == 'adjusted') {
            // convert from adjusted to normalized space
            const a = canvas.width / canvas.height;

            if(a >= 1)
                py *= a;
            else
                px /= a;
        }
        else if(space != 'normalized')
            throw new IllegalArgumentError(`Invalid space: "${space}"`);

        // convert from normalized to canvas space
        const x = 0.5 * (1 + px) * canvas.width;
        const y = 0.5 * (1 - py) * canvas.height;

        // done!
        return new Vector2(x, y);
    }

    /**
     * Convert a pixel position given in canvas space to a corresponding
     * position in space units. This is the inverse of convertToPixels().
     * @param position in canvas space
     * @space either "normalized" (default) or "adjusted"; see @PointerSpace
     * @returns an equivalent position in space units
     */
    convertFromPixels(position: Vector2, space: "normalized" | "adjusted" = 'normalized'): Vector2
    {
        const canvas = this.canvas;

        // convert from canvas to normalized space
        let x = 2 * position.x / canvas.width - 1;
        let y = -2 * position.y / canvas.height + 1;

        if(space == 'adjusted') {
            // convert from normalized to adjusted space
            const a = canvas.width / canvas.height;

            if(a >= 1)
                y /= a;
            else
                x *= a;
        }
        else if(space != 'normalized')
            throw new IllegalArgumentError(`Invalid space: "${space}"`);

        // done!
        return new Vector2(x, y);
    }

    /**
     * Initialize the viewport (when the session starts)
     * @param getMediaSize
     * @param sessionMode
     * @param wantStatsPanel
     * @internal
     */
    _init(getMediaSize: ViewportSizeGetter, sessionMode: SessionMode, wantStatsPanel: boolean): void
    {
        // validate if the viewport style matches the session mode
        if(sessionMode == 'immersive') {
            if(this._style != 'best-fit' && this._style != 'stretch' && this._style != 'crop') {
                Utils.warning(`Invalid viewport style \"${this._style}\" for the \"${sessionMode}\" mode`);
                this._style = 'best-fit';
                this._resizer.setStrategyByName(this._style);
            }
        }
        else if(sessionMode == 'inline') {
            if(this._style != 'inline') {
                Utils.warning(`Invalid viewport style \"${this._style}\" for the \"${sessionMode}\" mode`);
                this._style = 'inline';
                this._resizer.setStrategyByName(this._style);
            }
        }

        // set the media size getter
        this._mediaSize = getMediaSize;

        // initialize the components
        this._containers.init();
        this._canvases.init();
        this._resizer.init();
        this._fullscreen.init();

        // initialize the HUD
        const wantFullscreenButton = this.fullscreenAvailable && this._settings.fullscreenUI;
        const wantWatermark = this._settings.watermark;
        this._hud._init(HUD_ZINDEX, wantStatsPanel, wantFullscreenButton, wantWatermark);
    }

    /**
     * Release the viewport (when the session ends)
     * @internal
     */
    _release(): void
    {
        this._hud._release();
        this._fullscreen.release();
        this._resizer.release();
        this._canvases.release();
        this._containers.release();
    }
}