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
 * video-source.ts
 * <video>-based source of data
 */

import { Utils } from '../utils/utils';
import { MediaSource } from './media-source';

/**
 * <video>-based source of data
 */
export class VideoSource extends MediaSource
{
    /**
     * Constructor
     */
    constructor(video: HTMLVideoElement)
    {
        Utils.assert(video instanceof HTMLVideoElement, 'Expected a video element');
        super(video);
    }

    /**
     * Stats related to this source of data
     * @internal
     */
    get _stats(): string
    {
        return `${this._size} video`;
    }
}