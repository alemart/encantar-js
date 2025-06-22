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
 * canvas-source.ts
 * HTMLCanvasElement-based source of data
 */

import Speedy from 'speedy-vision';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { Utils, Nullable } from '../utils/utils';
import { IllegalOperationError } from '../utils/errors';
import { Source, SourceType } from './source';

/**
 * HTMLCanvasElement-based source of data
 */
export class CanvasSource implements Source
{
    /** canvas element */
    private _canvas: HTMLCanvasElement;

    /** media source */
    protected _media: Nullable<SpeedyMedia>;



    /**
     * Constructor
     */
    constructor(canvas: HTMLCanvasElement)
    {
        Utils.assert(canvas instanceof HTMLCanvasElement, 'Expected a canvas element');

        this._canvas = canvas;
        this._media = null;
    }

    /**
     * The underlying <canvas> element
     */
    get canvas(): HTMLCanvasElement
    {
        return this._canvas;
    }

    /**
     * Check if this source is of a certain type
     * @internal
     */
    _is<T extends keyof SourceType>(type: T): this is SourceType[T]
    {
        return type === 'canvas-source';
    }

    /**
     * Get media
     * @internal
     */
    get _internalMedia(): SpeedyMedia
    {
        if(this._media == null)
            throw new IllegalOperationError(`The media of the source of data isn't loaded`);

        return this._media;
    }

    /**
     * Stats related to this source of data
     * @internal
     */
    get _stats(): string
    {
        const media = this._media;

        if(media != null)
            return `${media.width}x${media.height} canvas`;
        else
            return 'uninitialized canvas';
    }

    /**
     * Initialize this source of data
     * @returns a promise that resolves as soon as this source of data is initialized
     * @internal
     */
    _init(): SpeedyPromise<void>
    {
        return Speedy.load(this._canvas).then(media => {
            Utils.log(`Source of data is a ${media.width}x${media.height} canvas`);
            this._media = media;
        });
    }

    /**
     * Release this source of data
     * @returns a promise that resolves as soon as this source of data is released
     * @internal
     */
    _release(): SpeedyPromise<void>
    {
        if(this._media)
            this._media.release();

        this._media = null;
        return Speedy.Promise.resolve();
    }
}