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
 * image-tracker-event.ts
 * Events emitted by an Image Tracker
 */

import { ReferenceImage } from './reference-image';
import { AREvent } from '../../utils/ar-events';

/** All possible event types emitted by an Image Tracker */
export type ImageTrackerEventType = 'targetfound' | 'targetlost';

/**
 * An event emitted by an Image Tracker
 */
export class ImageTrackerEvent extends AREvent<ImageTrackerEventType>
{
    /* the reference image to which this event is related to */
    private _referenceImage: ReferenceImage;



    /**
     * Constructor
     * @param type event type
     * @param referenceImage optional reference image
     */
    constructor(type: ImageTrackerEventType, referenceImage: ReferenceImage)
    {
        super(type);
        this._referenceImage = referenceImage;
    }

    /**
     * Reference image
     */
    get referenceImage(): ReferenceImage
    {
        return this._referenceImage;
    }
}