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
 * reference-image-database.ts
 * A collection of Reference Images
 */

import Speedy from 'speedy-vision';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { ReferenceImage, ReferenceImageWithMedia } from './reference-image';
import { Utils } from '../../utils/utils';
import { IllegalArgumentError, IllegalOperationError } from '../../utils/errors';

/** Default capacity of a Reference Image Database */
const DEFAULT_CAPACITY = 100; // this number should exceed normal usage
                              // XXX this number may be changed (is 100 too conservative?)
                              // further testing is needed to verify the appropriateness of this number;
                              // it depends on the images, on the keypoint descriptors, and even on the target devices

/**
 * A collection of Reference Images
 */
export class ReferenceImageDatabase implements Iterable<ReferenceImage>
{
    /** Entries */
    private _entries: Map<string, ReferenceImageWithMedia>;

    /** Maximum number of entries */
    private _capacity: number;

    /** Is the database locked? */
    private _locked: boolean;




    /**
     * Constructor
     */
    constructor()
    {
        this._capacity = DEFAULT_CAPACITY;
        this._entries = new Map();
        this._locked = false;
    }

    /**
     * The number of reference images stored in this database
     */
    get count(): number
    {
        return this._entries.size;
    }

    /**
     * Maximum number of elements
     */
    get capacity(): number
    {
        return this._capacity;
    }

    /**
     * Maximum number of elements
     * Increasing the capacity is considered experimental
     */
    set capacity(value: number)
    {
        const capacity = Math.max(0, value | 0);

        if(this.count > capacity)
            throw new IllegalArgumentError(`Can't set the capacity of the database to ${capacity}: it currently stores ${this.count} entries`);

        this._capacity = capacity;
    }

    /**
     * Iterates over the collection
     */
    [Symbol.iterator](): Iterator<ReferenceImageWithMedia>
    {
        return this._entries.values();
    }

    /**
     * Add reference images to this database
     * Add only the images you actually need to track!
     * (each image take up storage space)
     * @param referenceImages one or more reference images with unique names (a unique name will
     *                        be generated automatically if you don't specify one)
     * @returns a promise that resolves as soon as the images are loaded and added to this database
     */
    add(referenceImages: ReferenceImage[]): SpeedyPromise<void>
    {
        return this._preloadMany(referenceImages).then(referenceImagesWithMedia => {
            referenceImagesWithMedia.forEach(referenceImageWithMedia => {
                this._addOne(referenceImageWithMedia);
            });
        });
    }

    /**
     * Add a single preloaded reference image to the database
     * @param referenceImage
     */
    _addOne(referenceImage: ReferenceImageWithMedia): void
    {
        const name = referenceImage.name;

        // locked database?
        if(this._locked)
            throw new IllegalOperationError(`Can't add reference image "${name}" to the database: it's locked`);

        // reached full capacity?
        if(this.count >= this.capacity)
            throw new IllegalOperationError(`Can't add reference image "${name}" to the database: the capacity of ${this.capacity} images has been exceeded.`);

        // check if the image is valid
        if(!(referenceImage.image instanceof HTMLImageElement) && !(referenceImage.image instanceof HTMLCanvasElement) && !(referenceImage.image instanceof ImageBitmap))
            throw new IllegalArgumentError(`Can't add reference image "${name}" to the database: invalid image`);

        // check for duplicate names
        if(this._entries.has(name))
            throw new IllegalArgumentError(`Can't add reference image "${name}" to the database: found duplicated name`);

        // add the reference image to the database
        Utils.log(`Adding reference image "${name}" to the database...`);
        this._entries.set(name, referenceImage);
    }

    /**
     * Lock the database, so that new reference images can no longer be added to it
     * @internal
     */
    _lock(): void
    {
        this._locked = true;
    }

    /**
     * Get reference image by name
     * @param name
     * @returns the reference image with the given name, or null if there isn't any
     * @internal
     */
    _find(name: string): ReferenceImageWithMedia | null
    {
        return this._entries.get(name) || null;
    }

    /**
     * Load a reference image
     * @param referenceImage
     * @returns a promise that resolves to a corresponding ReferenceImageWithMedia
     */
    private _preloadOne(referenceImage: ReferenceImage): SpeedyPromise<ReferenceImageWithMedia>
    {
        if(referenceImage.name !== undefined)
            Utils.log(`Loading reference image \"${referenceImage.name}\"...`);
        else
            Utils.log(`Loading reference image...`);

        if(!referenceImage.image)
            return Speedy.Promise.reject(new IllegalArgumentError('The reference image was not provided!'));

        return Speedy.load(referenceImage.image).then(media => {
            return new ReferenceImageWithMedia(referenceImage, media);
        });
    }

    /**
     * Load multiple reference images
     * @param referenceImages
     * @returns a promise that resolves to corresponding ReferenceImageWithMedia objects
     */
    private _preloadMany(referenceImages: ReferenceImage[]): SpeedyPromise<ReferenceImageWithMedia[]>
    {
        const n = referenceImages.length;
        Utils.log(`Loading ${n} reference image${n != 1 ? 's' : ''}...`);

        const promises = referenceImages.map(referenceImage => this._preloadOne(referenceImage));
        return Speedy.Promise.all<ReferenceImageWithMedia>(promises);
    }
}