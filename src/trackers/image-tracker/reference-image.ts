/*
 * encantar.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022-2026 Alexandre Martins <alemartf(at)gmail.com>
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
 * reference-image.ts
 * Reference Image for tracking
 */

import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';

type ReferenceImageType = HTMLImageElement | ImageBitmap | ImageData;



/**
 * Reference Image for tracking
 */
export interface ReferenceImage
{
    /** Reference Images should have unique names given by the user */
    name?: string;

    /** Image data */
    readonly image: ReferenceImageType;
}

/**
 * A ReferenceImage decorated with a SpeedyMedia
 */
export class ReferenceImageWithMedia implements ReferenceImage
{
    /** The decorated reference image */
    private readonly _referenceImage: ReferenceImage;

    /** A SpeedyMedia corresponding to the reference image */
    private readonly _media: SpeedyMedia;

    /** The aspect ratio of the reference image */
    private readonly _aspectRatio: number;



    /**
     * Constructor
     * @param referenceImage
     * @param media
     */
    constructor(referenceImage: ReferenceImage, media: SpeedyMedia)
    {
        this._referenceImage = Object.assign({}, referenceImage);
        this._media = media;

        // generate a unique name if none is given
        if(this._referenceImage.name === undefined)
            this._referenceImage.name = this._generateUniqueName();

        // store the aspect ratio
        this._aspectRatio = media.width / media.height;
    }

    /**
     * Getter of the name of the reference image
     */
    get name(): string
    {
        return this._referenceImage.name!;
    }

    /**
     * Setter of the name of the reference image
     */
    set name(name: string)
    {
        this._referenceImage.name = name;
    }

    /**
     * Image data
     */
    get image(): ReferenceImageType
    {
        return this._referenceImage.image;
    }

    /**
     * A SpeedyMedia corresponding to the reference media
     */
    get media(): SpeedyMedia
    {
        return this._media;
    }

    /**
     * The aspect ratio of the reference image
     */
    get aspectRatio(): number
    {
        return this._aspectRatio;
    }

    /**
     * Generate a unique name for a reference image
     * @returns a unique name
     */
    private _generateUniqueName(): string
    {
        return 'target-' + Math.random().toString(16).substr(2);
    }
}