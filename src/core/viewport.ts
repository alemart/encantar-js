/*
 * MARTINS.js Free Edition
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022  Alexandre Martins <alemartf(at)gmail.com>
 * https://github.com/alemart/martins-js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * viewport.ts
 * Viewport
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { Nullable } from '../utils/utils';
import { Resolution } from './resolution';
import { Utils } from '../utils/utils';
import { IllegalArgumentError, IllegalOperationError } from '../utils/errors';
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

/**
 * Viewport interface
 */
export interface Viewport extends AREventTarget<ViewportEventType>
{
    /** Resolution of the virtual scene */
    readonly resolution: Resolution;

    /** Viewport container */
    readonly container: ViewportContainer;

    /** HUD */
    readonly hud: HUD;

    /** Size of the drawing buffer of the foreground canvas */
    readonly virtualSize: SpeedySize;

    /** Canvas on which the virtual scene will be drawn */
    readonly canvas: HTMLCanvasElement;

    /** Canvas on which the physical scene will be drawn @internal */
    readonly _background: HTMLCanvasElement;

    /** Size of the drawing buffer of the background canvas @internal */
    readonly _size: SpeedySize;

    /** Initialize the viewport @internal */
    _init(): void;

    /** Release the viewport @internal */
    _release(): void;

    /** Function to be called when the viewport is resized @internal */
    _onResize(): void;
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

    /** An existing <canvas> on which the virtual scene will be drawn */
    canvas?: Nullable<HTMLCanvasElement>;
}

/** Default viewport constructor settings */
const DEFAULT_VIEWPORT_SETTINGS: Readonly<Required<ViewportSettings>> = {
    container: null,
    hudContainer: null,
    resolution: 'lg',
    canvas: null,
};

/** Base z-index of the children of the viewport container */
const BASE_ZINDEX = 0;

/** Default viewport width, in pixels */
const DEFAULT_VIEWPORT_WIDTH = 300;

/** Default viewport height, in pixels */
const DEFAULT_VIEWPORT_HEIGHT = 150;



/**
 * Viewport
 */
export class BaseViewport extends AREventTarget<ViewportEventType> implements Viewport
{
    /** Viewport resolution (controls the size of the drawing buffer of the foreground canvas) */
    private readonly _resolution: Resolution;

    /** Viewport container */
    protected readonly _container: ViewportContainer;

    /** An overlay displayed in front of the augmented scene */
    protected readonly _hud: HUD;

    /** Internal canvas used to render the physical scene */
    protected readonly _backgroundCanvas: HTMLCanvasElement;

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

        // validate settings
        const settings = Object.assign({}, DEFAULT_VIEWPORT_SETTINGS, viewportSettings);
        if(settings.container == null)
            throw new IllegalArgumentError('Unspecified viewport container');

        // initialize attributes
        this._resolution = settings.resolution;
        this._container = settings.container;
        this._hud = new HUD(settings.container, settings.hudContainer);
        this._parentOfImportedForegroundCanvas = settings.canvas ? settings.canvas.parentNode : null;

        // create canvas elements
        const size = Speedy.Size(DEFAULT_VIEWPORT_WIDTH, DEFAULT_VIEWPORT_HEIGHT);
        this._backgroundCanvas = this._createBackgroundCanvas(this._container, size);
        this._foregroundCanvas = settings.canvas == null ?
            this._createForegroundCanvas(this._container, size) :
            this._foregroundCanvas = this._importForegroundCanvas(settings.canvas, this._container, size);
    }

    /**
     * Viewport container
     */
    get container(): ViewportContainer
    {
        return this._container;
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
     * Background canvas
     * @internal
     */
    get _background(): HTMLCanvasElement
    {
        return this._backgroundCanvas;
    }

    /**
     * Size of the drawing buffer of the background canvas, in pixels
     * @internal
     */
    get _size(): SpeedySize
    {
        throw new IllegalOperationError();
    }

    /**
     * Initialize the viewport (when the session starts)
     * @internal
     */
    _init(): void
    {
        this._container.style.touchAction = 'none';
        this._hud._init(BASE_ZINDEX + 2);
        this._hud.visible = true;
    }

    /**
     * Release the viewport (when the session starts)
     * @internal
     */
    _release(): void
    {
        //this._hud.visible = false; // depends on the type of the viewport
        this._hud._release();
        this._restoreImportedForegroundCanvas();
        this._container.style.touchAction = 'auto';
    }

    /**
     * Function to be called when the viewport is resized
     * @internal
     */
    _onResize(): void
    {
        // Resize the drawing buffer of the foreground canvas, so that it
        // matches the desired resolution and the aspect ratio of the
        // background canvas
        const virtualSize = this.virtualSize;
        this._foregroundCanvas.width = virtualSize.width;
        this._foregroundCanvas.height = virtualSize.height;
        this._styleCanvas(this._foregroundCanvas, 'foreground');

        // dispatch event
        const event = new ViewportEvent('resize');
        this.dispatchEvent(event);
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
        return this._styleCanvas(canvas, 'background');
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
        return this._styleCanvas(canvas, 'foreground');
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
     * Add suitable CSS rules to a canvas
     * @param canvas
     * @param canvasType
     * @returns canvas
     */
    private _styleCanvas(canvas: HTMLCanvasElement, canvasType: 'foreground' | 'background'): HTMLCanvasElement
    {
        const offset = (canvasType == 'foreground') ? 1 : 0;
        const zIndex = BASE_ZINDEX + offset;

        canvas.setAttribute('style', [
            'position: absolute',
            'left: 0px',
            'top: 0px',

            'z-index: ' + String(zIndex),

            'width: 100% !important',
            'height: 100% !important',
        ].join('; '));

        return canvas;
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
            throw new IllegalArgumentError(`Not a <canvas>: ${canvas}`);

        // borrow the canvas; add it as a child of the viewport container
        canvas.remove();
        parent.appendChild(canvas);

        canvas.width = size.width;
        canvas.height = size.height;

        canvas.dataset.cssText = canvas.style.cssText; // save CSS
        canvas.style.cssText = ''; // clear CSS
        this._styleCanvas(canvas, 'foreground');

        return canvas;
    }

    /**
     * Restore a previously imported foreground canvas to its original parent
     */
    private _restoreImportedForegroundCanvas(): void
    {
        // not an imported canvas; nothing to do
        if(this._parentOfImportedForegroundCanvas == null)
            return;

        const canvas = this._foregroundCanvas;
        canvas.style.cssText = canvas.dataset.cssText || ''; // restore CSS
        canvas.remove();
        this._parentOfImportedForegroundCanvas.appendChild(canvas);
    }
}

/**
 * Viewport decorator
 */
abstract class ViewportDecorator extends AREventTarget<ViewportEventType> implements Viewport
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
     * HUD
     */
    get hud(): HUD
    {
        return this._base.hud;
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
     * Background canvas
     * @internal
     */
    get _background(): HTMLCanvasElement
    {
        return this._base._background;
    }

    /**
     * Size of the drawing buffer of the background canvas, in pixels
     * @internal
     */
    get _size(): SpeedySize
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
     * Function to be called when the viewport is resized
     * @internal
     */
    _onResize(): void
    {
        this._base._onResize();
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
    constructor(base: Viewport, getSize: ViewportSizeGetter)
    {
        super(base, getSize);
        this._active = false;
    }

    /**
     * Resize the viewport
     */
    protected abstract _resize(): void;

    /**
     * Initialize the viewport
     * @internal
     */
    _init(): void
    {
        super._init();
        this._active = true;

        // Configure the resize listener. We want the viewport
        // to adjust itself if the phone/screen is resized or
        // changes orientation
        let timeout: Nullable<ReturnType<typeof setTimeout>> = null;
        const onresize = () => {
            if(!this._active) {
                window.removeEventListener('resize', onresize);
                return;
            }

            if(timeout !== null)
                clearTimeout(timeout);

            timeout = setTimeout(() => {
                timeout = null;
                this._resize.call(this);
                this._onResize.call(this);
            }, 100);
        };

        window.addEventListener('resize', onresize);
        this._resize();
        this._onResize();
    }

    /**
     * Release the viewport
     * @internal
     */
    _release(): void
    {
        this._active = false;
        super._release();
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
        this._background.remove();
        this.hud.visible = false;
        this.container.style.cssText = ''; // reset CSS

        super._release();
    }

    /**
     * Resize the immersive viewport, so that it occupies the entire page.
     * We respect the aspect ratio of the source media
     */
    protected _resize(): void
    {
        const { width, height } = this._size;
        const viewportSize = Speedy.Size(0, 0);
        const viewportAspectRatio = width / height;
        const windowSize = Speedy.Size(window.innerWidth, window.innerHeight);
        const windowAspectRatio = windowSize.width / windowSize.height;

        // figure out the viewport size
        if(viewportAspectRatio <= windowAspectRatio) {
            viewportSize.height = windowSize.height;
            viewportSize.width = (viewportSize.height * viewportAspectRatio) | 0;
        }
        else {
            viewportSize.width = windowSize.width;
            viewportSize.height = (viewportSize.width / viewportAspectRatio) | 0;
        }

        // position the viewport and set its size
        const container = this.container;
        container.style.position = 'fixed';
        container.style.left = `calc(50% - ${viewportSize.width >>> 1}px)`;
        container.style.top = `calc(50% - ${viewportSize.height >>> 1}px)`;
        container.style.zIndex = '1000000000'; // 1B //String(2147483647);
        container.style.width = viewportSize.width + 'px';
        container.style.height = viewportSize.height + 'px';
        container.style.backgroundColor = '#000';

        // set the size of the drawing buffer of the background canvas
        const backgroundCanvas = this._background;
        const backgroundCanvasAspectRatio = viewportAspectRatio;
        const referenceHeight = height;
        backgroundCanvas.height = referenceHeight;
        backgroundCanvas.width = (backgroundCanvas.height * backgroundCanvasAspectRatio) | 0;
    }
}

/**
 * Inline viewport: it follows the typical flow of a web page
 */
export class InlineViewport extends ResizableViewport
{
    /**
     * Resize the inline viewport
     */
    protected _resize(): void
    {
        const { width, height } = this._size;

        this.container.style.position = 'relative';
        this.container.style.width = width + 'px';
        this.container.style.height = height + 'px';
        //this.container.style.display = 'inline-block';

        this._background.width = width;
        this._background.height = height;
    }
}