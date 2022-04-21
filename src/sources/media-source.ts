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
 * media-source.ts
 * SpeedyMedia-based source of data
 */

import Speedy from 'speedy-vision';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { Utils, Nullable } from '../utils/utils';
import { Resolution } from '../core/resolution';
import { IllegalOperationError, NotSupportedError, AccessDeniedError } from '../utils/errors';
import { Source } from './source';


/**
 * SpeedyMedia-based source of data
 */
export abstract class MediaSource implements Source
{
    /** source element */
    private _source: HTMLVideoElement | HTMLCanvasElement;

    /** media source */
    protected _media: Nullable<SpeedyMedia>;



    /**
     * Constructor
     */
    constructor(source: HTMLVideoElement | HTMLCanvasElement)
    {
        this._media = null;
        this._source = source;
    }

    /**
     * A type-identifier of the source of data
     * @internal
     */
    get _type(): string
    {
        return 'video';
    }

    /**
     * Get media
     * @internal
     */
    get _data(): SpeedyMedia
    {
        if(this._media == null)
            throw new IllegalOperationError(`The media of the source of data isn't loaded`);

        return this._media;
    }

    /**
     * Stats related to this source of data
     * @internal
     */
    abstract get _stats(): string;

    /**
     * Initialize this source of data
     * @returns a promise that resolves as soon as this source of data is initialized
     * @internal
     */
    _init(): SpeedyPromise<void>
    {
        return Speedy.load(this._source).then(media => {
            Utils.log(`Source of data is ${media.width}x${media.height}`);
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

    /**
     * A string featuring the size of the media, in pixels
     */
    protected get _size(): string
    {
        const media = this._media;

        if(media != null)
            return `${media.width}x${media.height}`;
        else
            return '-';
    }
}