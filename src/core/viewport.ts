/*
 * MARTINS.js
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
 * viewport.ts
 * Viewport
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { Nullable } from '../utils/utils';
import { Resolution } from './resolution';
import { Utils } from '../utils/utils';
import { IllegalArgumentError, IllegalOperationError, NotSupportedError, AccessDeniedError } from '../utils/errors';
import { HUD, HUDContainer } from './hud';
import { AREvent, AREventTarget, AREventListener } from '../utils/ar-events';



/** Viewport container */
export type ViewportContainer = HTMLDivElement;

/** We admit that the size of the drawing buffer of the background canvas of the viewport may change over time */
type ViewportSizeGetter = () => SpeedySize;

/** All possible event types emitted by a Viewport */
type ViewportEventType = 'resize';

/** An event emitted by a Viewport */
class ViewportEvent extends AREvent<ViewportEventType> { }

/** Viewport event target */
class ViewportEventTarget extends AREventTarget<ViewportEventType> { }

/** Viewport style (immersive mode) */
type ViewportStyle = 'best-fit' | 'stretch' | 'inline';



/**
 * Viewport interface
 */
export interface Viewport extends ViewportEventTarget
{
    /** Resolution of the virtual scene */
    readonly resolution: Resolution;

    /** Viewport container */
    readonly container: ViewportContainer;

    /** Viewport style */
    style: ViewportStyle;

    /** HUD */
    readonly hud: HUD;

    /** Fullscreen mode */
    readonly fullscreen: boolean;

    /** Canvas on which the virtual scene will be drawn */
    readonly canvas: HTMLCanvasElement;

    /** Size of the drawing buffer of the foreground canvas */
    readonly virtualSize: SpeedySize;

    /** Request fullscreen mode */
    requestFullscreen(): SpeedyPromise<void>;

    /** Exit fullscreen mode */
    exitFullscreen(): SpeedyPromise<void>;

    /** Is the fullscreen mode available? */
    isFullscreenAvailable(): boolean;

    /** Canvas on which the physical scene will be drawn @internal */
    readonly _backgroundCanvas: HTMLCanvasElement;

    /** Size of the drawing buffer of the background canvas @internal */
    readonly _realSize: SpeedySize;

    /** Initialize the viewport @internal */
    _init(): void;

    /** Release the viewport @internal */
    _release(): void;
}

/**
 * Viewport constructor settings
 */
export interface ViewportSettings
{
    /** Viewport container */
    container: Nullable<ViewportContainer>;

    /** HUD container (must be a direct child of container) */
    hudContainer?: Nullable<HUDContainer>;

    /** Resolution of the canvas on which the virtual scene will be drawn */
    resolution?: Resolution;

    /** Viewport style */
    style?: ViewportStyle;

    /** An existing <canvas> on which the virtual scene will be drawn */
    canvas?: Nullable<HTMLCanvasElement>;
}

/** Default viewport constructor settings */
const DEFAULT_VIEWPORT_SETTINGS: Readonly<Required<ViewportSettings>> = {
    container: null,
    hudContainer: null,
    resolution: 'lg',
    style: 'best-fit',
    canvas: null,
};

/** Z-index of the viewport container */
const CONTAINER_ZINDEX = 1000000000;

/** Base z-index of the children of the viewport container */
const BASE_ZINDEX = 0;

/** Z-index of the background canvas */
const BACKGROUND_ZINDEX = BASE_ZINDEX + 0;

/** Z-index of the foreground canvas */
const FOREGROUND_ZINDEX = BASE_ZINDEX + 1;

/** Z-index of the HUD */
const HUD_ZINDEX = BASE_ZINDEX + 2;

/** Default viewport width, in pixels */
const DEFAULT_VIEWPORT_WIDTH = 300;

/** Default viewport height, in pixels */
const DEFAULT_VIEWPORT_HEIGHT = 150;



/**
 * Viewport
 */
export class BaseViewport extends ViewportEventTarget implements Viewport
{
    /** Viewport resolution (controls the size of the drawing buffer of the foreground canvas) */
    private readonly _resolution: Resolution;

    /** Viewport container */
    protected readonly _container: ViewportContainer;

    /** An overlay displayed in front of the augmented scene */
    protected readonly _hud: HUD;

    /** Viewport style */
    protected _style: ViewportStyle;

    /** Internal canvas used to render the physical scene */
    private readonly __backgroundCanvas: HTMLCanvasElement;

    /** A canvas used to render the virtual scene */
    protected readonly _foregroundCanvas: HTMLCanvasElement;

    /** Original parent of the foreground canvas, if it's imported from somewhere */
    private readonly _parentOfImportedForegroundCanvas: Nullable<Node>;



    /**
     * Constructor
     * @param viewportSettings
     */
    constructor(viewportSettings: ViewportSettings)
    {
        super();

        const settings = Object.assign({}, DEFAULT_VIEWPORT_SETTINGS, viewportSettings);
        const size = Speedy.Size(DEFAULT_VIEWPORT_WIDTH, DEFAULT_VIEWPORT_HEIGHT);

        // validate settings
        if(settings.container == null)
            throw new IllegalArgumentError('Unspecified viewport container');
        else if(!(settings.container instanceof HTMLElement))
            throw new IllegalArgumentError('Invalid viewport container');

        // initialize attributes
        this._resolution = settings.resolution;
        this._container = settings.container;
        this._hud = new HUD(settings.container, settings.hudContainer);

        // make this more elegant?
        // need to initialize this._style and validate settings.style
        this._style = DEFAULT_VIEWPORT_SETTINGS.style;
        this.style = settings.style;

        // create the background canvas
        this.__backgroundCanvas = this._createBackgroundCanvas(this._container, size);

        // create the foreground canvas
        if(settings.canvas == null) {
            this._foregroundCanvas = this._createForegroundCanvas(this._container, size);
            this._parentOfImportedForegroundCanvas = null;
        }
        else {
            this._foregroundCanvas = settings.canvas;
            this._parentOfImportedForegroundCanvas = settings.canvas.parentNode;
        }
    }

    /**
     * Make a request to the user agent so that the viewport container is
     * displayed in fullscreen mode. The container must be a compatible element[1]
     * and the user must interact with the page in order to comply with browser
     * policies[2]. In case of error, the returned promise is rejected.
     * [1] https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen#compatible_elements
     * [2] https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen#security
     */
    requestFullscreen(): SpeedyPromise<void>
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
                    if(container === (document as any).webkitFullscreenElement)
                        resolve();
                    else
                        reject(new AccessDeniedError());
                }, 100);
            });
        }

        // check if fullscreen is supported
        if(!document.fullscreenEnabled)
            return Speedy.Promise.reject(new AccessDeniedError());

        // request fullscreen
        return new Speedy.Promise<void>((resolve, reject) => {
            container.requestFullscreen({
                navigationUI: 'hide'
            }).then(resolve, reject);
        });
    }

    /**
     * Exit fullscreen mode
     */
    exitFullscreen(): SpeedyPromise<void>
    {
        // fallback for older WebKit versions
        if(document.exitFullscreen === undefined) {
            const doc = document as any;

            if(doc.webkitExitFullscreen === undefined)
                return Speedy.Promise.reject(new NotSupportedError());
            else if(doc.webkitFullscreenElement === null)
                return Speedy.Promise.reject(new TypeError('Not in fullscreen mode'));

            // webkitExitFullscreen() does not return a value
            doc.webkitExitFullscreen();

            return new Speedy.Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    if(doc.webkitFullscreenElement === null)
                        resolve();
                    else
                        reject(new TypeError());
                }, 100);
            });
        }

        // exit fullscreen
        return new Speedy.Promise<void>((resolve, reject) => {
            document.exitFullscreen().then(resolve, reject);
        });
    }

    /** Is the fullscreen mode available? */
    isFullscreenAvailable(): boolean
    {
        return document.fullscreenEnabled ||
               !!((document as any).webkitFullscreenEnabled);
    }

    /**
     * True if the viewport is being displayed in fullscreen mode
     */
    get fullscreen(): boolean
    {
        if(document.fullscreenElement !== undefined)
            return document.fullscreenElement === this._container;
        else if((document as any).webkitFullscreenElement !== undefined)
            return (document as any).webkitFullscreenElement === this._container;
        else
            return false;
    }

    /**
     * Viewport container
     */
    get container(): ViewportContainer
    {
        return this._container;
    }

    /**
     * Viewport style
     */
    get style(): ViewportStyle
    {
        return this._style;
    }

    /**
     * Set viewport style
     */
    set style(value: ViewportStyle)
    {
        if(value != 'best-fit' && value != 'stretch' && value != 'inline')
            throw new IllegalArgumentError('Invalid viewport style: ' + value);

        const changed = (value != this._style);
        this._style = value;

        if(changed) {
            const event = new ViewportEvent('resize');
            this.dispatchEvent(event);
        }
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
        const aspectRatio = this._backgroundCanvas.width / this._backgroundCanvas.height;
        return Utils.resolution(this._resolution, aspectRatio);
    }

    /**
     * The canvas on which the virtual scene will be drawn
     */
    get canvas(): HTMLCanvasElement
    {
        return this._foregroundCanvas;
    }

    /**
     * The canvas on which the physical scene will be drawn
     * @internal
     */
    get _backgroundCanvas(): HTMLCanvasElement
    {
        return this.__backgroundCanvas;
    }

    /**
     * Size of the drawing buffer of the background canvas, in pixels
     * @internal
     */
    get _realSize(): SpeedySize
    {
        throw new IllegalOperationError();
    }

    /**
     * Initialize the viewport (when the session starts)
     * @internal
     */
    _init(): void
    {
        // import foreground canvas
        if(this._parentOfImportedForegroundCanvas != null) {
            const size = Speedy.Size(DEFAULT_VIEWPORT_WIDTH, DEFAULT_VIEWPORT_HEIGHT);
            this._importForegroundCanvas(this._foregroundCanvas, this._container, size);
        }

        // setup CSS
        this._container.style.touchAction = 'none';
        this._container.style.backgroundColor = 'black';
        this._container.style.zIndex = String(CONTAINER_ZINDEX);

        // initialize the HUD
        this._hud._init(HUD_ZINDEX);
        this._hud.visible = true;
    }

    /**
     * Release the viewport (when the session starts)
     * @internal
     */
    _release(): void
    {
        // release the HUD
        this._hud._release();

        // reset the CSS
        this._container.style.touchAction = 'auto';

        // restore imported canvas
        if(this._parentOfImportedForegroundCanvas != null)
            this._restoreImportedForegroundCanvas();
    }

    /**
     * Create a canvas and attach it to another HTML element
     * @param parent parent container
     * @param size size of the drawing buffer
     * @returns a new canvas as a child of parent
     */
    private _createCanvas(parent: HTMLElement, size: SpeedySize): HTMLCanvasElement
    {
        const canvas = document.createElement('canvas') as HTMLCanvasElement;

        canvas.width = size.width;
        canvas.height = size.height;
        parent.appendChild(canvas);

        return canvas;
    }

    /**
     * Create the background canvas
     * @param parent parent container
     * @param size size of the drawing buffer
     * @returns a new canvas as a child of parent
     */
    private _createBackgroundCanvas(parent: ViewportContainer, size: SpeedySize): HTMLCanvasElement
    {
        const canvas = this._createCanvas(parent, size);
        return this._styleCanvas(canvas, BACKGROUND_ZINDEX);
    }

    /**
     * Create the foreground canvas
     * @param parent parent container
     * @param size size of the drawing buffer
     * @returns a new canvas as a child of parent
     */
    private _createForegroundCanvas(parent: ViewportContainer, size: SpeedySize): HTMLCanvasElement
    {
        const canvas = this._createCanvas(parent, size);
        return this._styleCanvas(canvas, FOREGROUND_ZINDEX);
    }

    /**
     * Import an existing foreground canvas to the viewport
     * @param canvas existing canvas
     * @param parent parent container
     * @param size size of the drawing buffer
     * @returns the input canvas
     */
    private _importForegroundCanvas(canvas: HTMLCanvasElement, parent: ViewportContainer, size: SpeedySize): HTMLCanvasElement
    {
        if(!(canvas instanceof HTMLCanvasElement))
            throw new IllegalArgumentError('Not a canvas: ' + canvas);

        // borrow the canvas; add it as a child of the viewport container
        canvas.remove();
        parent.appendChild(canvas);

        canvas.width = size.width;
        canvas.height = size.height;

        canvas.dataset.cssText = canvas.style.cssText; // save CSS
        canvas.style.cssText = ''; // clear CSS
        this._styleCanvas(canvas, FOREGROUND_ZINDEX);

        return canvas;
    }

    /**
     * Restore a previously imported foreground canvas to its original parent
     */
    private _restoreImportedForegroundCanvas(): void
    {
        // not an imported canvas; nothing to do
        if(this._parentOfImportedForegroundCanvas == null)
            throw new IllegalOperationError();

        const canvas = this._foregroundCanvas;
        canvas.style.cssText = canvas.dataset.cssText || ''; // restore CSS
        canvas.remove();
        this._parentOfImportedForegroundCanvas.appendChild(canvas);
    }

    /**
     * Add suitable CSS rules to a canvas
     * @param canvas
     * @param canvasType
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

        return canvas;
    }
}

/**
 * Viewport decorator
 */
abstract class ViewportDecorator extends ViewportEventTarget implements Viewport
{
    /** The decorated viewport */
    private _base: Viewport;

    /** Size getter (the size of the viewport may change over time) */
    private _getSize: ViewportSizeGetter;



    /**
     * Constructor
     * @param base to be decorated
     * @param getSize size getter
     */
    constructor(base: Viewport, getSize: ViewportSizeGetter)
    {
        super();

        this._base = base;
        this._getSize = getSize;
    }

    /**
     * Viewport container
     */
    get container(): ViewportContainer
    {
        return this._base.container;
    }

    /**
     * Viewport style
     */
    get style(): ViewportStyle
    {
        return this._base.style;
    }

    /**
     * Set viewport style
     */
    set style(value: ViewportStyle)
    {
        this._base.style = value;
    }

    /**
     * HUD
     */
    get hud(): HUD
    {
        return this._base.hud;
    }

    /**
     * Fullscreen mode
     */
    get fullscreen(): boolean
    {
        return this._base.fullscreen;
    }

    /**
     * Resolution of the virtual scene
     */
    get resolution(): Resolution
    {
        return this._base.resolution;
    }

    /**
     * Size in pixels of the drawing buffer of the canvas
     * on which the virtual scene will be drawn
     */
    get virtualSize(): SpeedySize
    {
        return this._base.virtualSize;
    }

    /**
     * The canvas on which the virtual scene will be drawn
     */
    get canvas(): HTMLCanvasElement
    {
        return this._base.canvas;
    }

    /**
     * Request fullscreen mode
     */
    requestFullscreen(): SpeedyPromise<void>
    {
        return this._base.requestFullscreen();
    }

    /**
     * Exit fullscreen mode
     */
    exitFullscreen(): SpeedyPromise<void>
    {
        return this._base.exitFullscreen();
    }

    /**
     * Is the fullscreen mode available?
     */
    isFullscreenAvailable(): boolean
    {
        return this._base.fullscreenAvailable;
    }

    /**
     * Background canvas
     * @internal
     */
    get _backgroundCanvas(): HTMLCanvasElement
    {
        return this._base._backgroundCanvas;
    }

    /**
     * Size of the drawing buffer of the background canvas, in pixels
     * @internal
     */
    get _realSize(): SpeedySize
    {
        return this._getSize();
    }

    /**
     * Initialize the viewport
     * @internal
     */
    _init(): void
    {
        this._base._init();
    }

    /**
     * Release the viewport
     * @internal
     */
    _release(): void
    {
        this._base._release();
    }

    /**
     * Add event listener
     * @param type event type
     * @param callback
     */
    addEventListener(type: ViewportEventType, callback: AREventListener): void
    {
        this._base.addEventListener(type, callback);
    }

    /**
     * Remove event listener
     * @param type event type
     * @param callback
     */
    removeEventListener(type: ViewportEventType, callback: AREventListener): void
    {
        this._base.removeEventListener(type, callback);
    }

    /**
     * Synchronously trigger an event
     * @param event
     * @returns same value as a standard event target
     * @internal
     */
    dispatchEvent(event: ViewportEvent): boolean
    {
        return this._base.dispatchEvent(event);
    }
}

/**
 * A viewport that watches for page resizes
 */
abstract class ResizableViewport extends ViewportDecorator
{
    /** is this viewport subject to being resized? */
    private _active: boolean;



    /**
     * Constructor
     * @param base to be decorated
     * @param getSize size getter
     */
    constructor(base: BaseViewport, getSize: ViewportSizeGetter)
    {
        super(base, getSize);
        this._active = false;
        this.addEventListener('resize', this._onResize.bind(this));
    }

    /**
     * Initialize the viewport
     * @internal
     */
    _init(): void
    {
        super._init();
        this._active = true;

        // bound resize
        const resize = this._resize.bind(this);

        // Configure the resize listener. We want the viewport
        // to adjust itself if the phone/screen is resized or
        // changes orientation
        let timeout: Nullable<ReturnType<typeof setTimeout>> = null;
        const onWindowResize = () => {
            if(!this._active) {
                window.removeEventListener('resize', onWindowResize);
                return;
            }

            if(timeout !== null)
                clearTimeout(timeout);

            timeout = setTimeout(() => {
                timeout = null;
                resize();
            }, 50);
        };
        window.addEventListener('resize', onWindowResize);

        // handle changes of orientation
        // (is this needed? we already listen to resize events)
        if(screen.orientation !== undefined)
            screen.orientation.addEventListener('change', resize);
        else
            window.addEventListener('orientationchange', resize); // deprecated

        // trigger a resize to setup the sizes / the CSS
        resize();
    }

    /**
     * Release the viewport
     * @internal
     */
    _release(): void
    {
        if(screen.orientation !== undefined)
            screen.orientation.removeEventListener('change', this._resize);
        else
            window.removeEventListener('orientationchange', this._resize); // deprecated

        this._active = false;
        super._release();
    }

    /**
     * Trigger a resize event
     */
    private _resize(): void
    {
        const event = new ViewportEvent('resize');
        this.dispatchEvent(event);
    }

    /**
     * Function to be called when the viewport is resized
     */
    protected _onResize(): void
    {
        // Resize the drawing buffer of the foreground canvas, so that it
        // matches the desired resolution, as well as the aspect ratio of the
        // background canvas
        const foregroundCanvas = this.canvas;
        const virtualSize = this.virtualSize;
        foregroundCanvas.width = virtualSize.width;
        foregroundCanvas.height = virtualSize.height;

        // Resize the drawing buffer of the background canvas
        const backgroundCanvas = this._backgroundCanvas;
        const realSize = this._realSize;
        backgroundCanvas.width = realSize.width;
        backgroundCanvas.height = realSize.height;
    }
}

/**
 * Immersive viewport: it occupies the entire page
 */
export class ImmersiveViewport extends ResizableViewport
{
    /**
     * Release the viewport
     * @internal
     */
    _release(): void
    {
        this.canvas.remove();
        this._backgroundCanvas.remove();
        this.hud.visible = false;
        this.container.style.cssText = ''; // reset CSS

        super._release();
    }

    /**
     * Resize the immersive viewport, so that it occupies the entire page.
     * We respect the aspect ratio of the source media
     */
    protected _onResize(): void
    {
        super._onResize();

        const container = this.container;
        container.style.position = 'fixed';

        if(this.style == 'best-fit') {
            // cover the page while maintaining the aspect ratio
            let viewportWidth = 0, viewportHeight = 0;
            const windowAspectRatio = window.innerWidth / window.innerHeight;
            const viewportAspectRatio = this._realSize.width / this._realSize.height;

            if(viewportAspectRatio <= windowAspectRatio) {
                viewportHeight = window.innerHeight;
                viewportWidth = (viewportHeight * viewportAspectRatio) | 0;
            }
            else {
                viewportWidth = window.innerWidth;
                viewportHeight = (viewportWidth / viewportAspectRatio) | 0;
            }

            container.style.left = `calc(50% - ${viewportWidth >>> 1}px)`;
            container.style.top = `calc(50% - ${viewportHeight >>> 1}px)`;
            container.style.width = viewportWidth + 'px';
            container.style.height = viewportHeight + 'px';
        }
        else if(this.style == 'stretch') {
            // stretch to cover the entire page
            container.style.left = '0px';
            container.style.top = '0px';
            container.style.width = window.innerWidth + 'px';
            container.style.height = window.innerHeight + 'px';
        }
        else
            throw new IllegalOperationError('Invalid immersive viewport style: ' + this.style);
    }
}

/**
 * Inline viewport: it follows the typical flow of a web page
 */
export class InlineViewport extends ResizableViewport
{
    /**
     * Initialize the viewport
     * @internal
     */
    _init(): void
    {
        super._init();
        this.style = 'inline';
    }

    /**
     * Release the viewport
     * @internal
     */
    _release(): void
    {
        this.container.style.cssText = ''; // reset CSS
        super._release();
    }

    /**
     * Resize the inline viewport
     * (we still take orientation changes into account)
     */
    protected _onResize(): void
    {
        super._onResize();

        const container = this.container;
        container.style.position = 'relative';

        if(this.style == 'inline') {
            container.style.left = '0px';
            container.style.top = '0px';
            container.style.width = this.virtualSize.width + 'px';
            container.style.height = this.virtualSize.height + 'px';
        }
        else
            throw new IllegalOperationError('Invalid inline viewport style: ' + this.style);
    }
}