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
 * pointer-source.ts
 * Source of data of pointer-based input: mouse, touch, pen...
 */

import Speedy from 'speedy-vision';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { Source } from './source';
import { Viewport } from '../core/viewport'
import { Utils, Nullable } from '../utils/utils';


/**
 * Source of data of pointer-based input: mouse, touch, pen...
 */
export class PointerSource implements Source
{
    /** a queue of incoming pointer events */
    private _queue: PointerEvent[];

    /** the viewport linked to this source of data */
    private _viewport: Nullable<Viewport>;



    /**
     * Constructor
     */
    constructor()
    {
        this._queue = [];
        this._viewport = null;
        this._onPointerEvent = this._onPointerEvent.bind(this);
        this._cancelEvent = this._cancelEvent.bind(this);
    }

    /**
     * A type-identifier of the source of data
     * @internal
     */
    get _type(): string
    {
        return 'pointer-source';
    }

    /**
     * Consume a pointer event
     * @returns the next pointer event to be consumed, or null if there are none
     * @internal
     */
    _consume(): PointerEvent | null
    {
        // producer-consumer mechanism
        return this._queue.shift() || null;
    }

    /**
     * Stats related to this source of data
     * @internal
     */
    get _stats(): string
    {
        return 'pointer input';
    }

    /**
     * Initialize this source of data
     * @returns a promise that resolves as soon as this source of data is initialized
     * @internal
     */
    _init(): SpeedyPromise<void>
    {
        Utils.log('Initializing PointerSource...');

        // nothing to do yet; we need the viewport
        return Speedy.Promise.resolve();
    }

    /**
     * Release this source of data
     * @returns a promise that resolves as soon as this source of data is released
     * @internal
     */
    _release(): SpeedyPromise<void>
    {
        this._setViewport(null);
        return Speedy.Promise.resolve();
    }

    /**
     * Link a viewport to this source of data
     * @param viewport possibly null
     * @internal
     */
    _setViewport(viewport: Viewport | null): void
    {
        // unlink previous viewport, if any
        if(this._viewport !== null) {
            this._viewport.hud.container.style.removeProperty('pointer-events');
            this._viewport._subContainer.style.removeProperty('pointer-events');
            this._viewport.container.style.removeProperty('pointer-events');
            this._viewport.canvas.style.removeProperty('pointer-events');
            this._removeEventListeners(this._viewport.canvas);
        }

        // link new viewport, if any
        if((this._viewport = viewport) !== null) {
            this._addEventListeners(this._viewport.canvas);
            this._viewport.canvas.style.pointerEvents = 'auto';
            this._viewport.container.style.pointerEvents = 'none';
            this._viewport._subContainer.style.pointerEvents = 'none';
            this._viewport.hud.container.style.pointerEvents = 'none';

            // Make HUD elements accept pointer events
            for(const element of this._viewport.hud.container.children as any as HTMLElement[]) {
                if(element.style.getPropertyValue('pointer-events') == '')
                    element.style.pointerEvents = 'auto';
            }
        }
    }

    /**
     * Event handler
     * @param event
     */
    private _onPointerEvent(event: PointerEvent): void
    {
        this._queue.push(event);
        event.preventDefault();
    }

    /**
     * Cancel event
     * @param event
     */
    private _cancelEvent(event: Event): void
    {
        if(event.cancelable)
            event.preventDefault();
    }

    /**
     * Add event listeners
     * @param canvas
     */
    private _addEventListeners(canvas: HTMLCanvasElement): void
    {
        canvas.addEventListener('pointerdown', this._onPointerEvent);
        canvas.addEventListener('pointerup', this._onPointerEvent);
        canvas.addEventListener('pointermove', this._onPointerEvent);
        canvas.addEventListener('pointercancel', this._onPointerEvent);
        canvas.addEventListener('pointerleave', this._onPointerEvent);
        canvas.addEventListener('pointerenter', this._onPointerEvent);
        canvas.addEventListener('touchstart', this._cancelEvent, { passive: false });
    }

    /**
     * Remove event listeners
     * @param canvas
     */
    private _removeEventListeners(canvas: HTMLCanvasElement): void
    {
        canvas.removeEventListener('touchstart', this._cancelEvent);
        canvas.removeEventListener('pointerenter', this._onPointerEvent);
        canvas.removeEventListener('pointerleave', this._onPointerEvent);
        canvas.removeEventListener('pointercancel', this._onPointerEvent);
        canvas.removeEventListener('pointermove', this._onPointerEvent);
        canvas.removeEventListener('pointerup', this._onPointerEvent);
        canvas.removeEventListener('pointerdown', this._onPointerEvent);
    }
}
