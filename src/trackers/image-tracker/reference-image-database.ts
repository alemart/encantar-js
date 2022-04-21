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
 * reference-image-database.ts
 * A collection of Reference Images
 */

import Speedy from 'speedy-vision';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { ReferenceImage } from './reference-image';
import { IllegalArgumentError, IllegalOperationError } from '../../utils/errors';

/** Default capacity of a Reference Image Database */
const DEFAULT_CAPACITY = 100;

/** Generate a unique name for a reference image */
const generateUniqueName = () => 'target-' + Math.random().toString(16).substr(2);

/**
 * An entry of a Reference Image Database
 */
interface ReferenceImageDatabaseEntry
{
    /** reference image */
    readonly referenceImage: ReferenceImage;

    /** previously loaded media */
    readonly media: SpeedyMedia;
}

/**
 * A collection of Reference Images
 */
export class ReferenceImageDatabase implements Iterable<ReferenceImage>
{
    /** Image database */
    private _database: ReferenceImageDatabaseEntry[];

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
        this._database = [];
        this._locked = false;
    }

    /**
     * The number of reference images stored in this database
     */
    get count(): number
    {
        return this._database.length;
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
     */
    /*
    set capacity(value: number)
    {
        const capacity = Math.max(0, value | 0);

        if(this.count > capacity)
            throw new IllegalArgumentError(`Can't set the capacity of the database to ${this._capacity}: it currently stores ${this.count} entries`);

        this._capacity = capacity;
    }
    */

    /**
     * Iterates over the collection
     */
    *[Symbol.iterator](): Iterator<ReferenceImage>
    {
        const ref = this._database.map(entry => entry.referenceImage);
        yield* ref;
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
        // handle no input
        if(referenceImages.length == 0)
            return Speedy.Promise.resolve();

        // handle multiple images as input
        if(referenceImages.length > 1) {
            const promises = referenceImages.map(image => this.add([ image ]));
            return Speedy.Promise.all(promises).then(() => void(0));
        }

        // handle a single image as input
        const referenceImage = referenceImages[0];

        // locked database?
        if(this._locked)
            throw new IllegalOperationError(`Can't add reference image to the database: it's locked`);

        // reached full capacity?
        if(this.count >= this.capacity)
            throw new IllegalOperationError(`Can't add reference image to the database: the capacity of ${this.capacity} images has been exceeded.`);

        // check for duplicate names
        if(this._database.find(entry => entry.referenceImage.name === referenceImage.name) !== undefined)
            throw new IllegalArgumentError(`Can't add reference image to the database: found duplicated name "${referenceImage.name}"`);

        // load the media and add the reference image to the database
        return Speedy.load(referenceImage.image).then(media => {
            this._database.push({
                referenceImage: Object.freeze({
                    ...referenceImage,
                    name: referenceImage.name || generateUniqueName()
                }),
                media: media
            });
        });
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
     * Get the media object associated to a reference image
     * @param name reference image name
     * @returns media
     * @internal
     */
    _findMedia(name: string): SpeedyMedia
    {
        for(let i = 0; i < this._database.length; i++) {
            if(this._database[i].referenceImage.name === name)
                return this._database[i].media;
        }

        throw new IllegalArgumentError(`Can't find reference image "${name}"`);
    }
}