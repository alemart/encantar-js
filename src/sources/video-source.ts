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
 * HTMLVideoElement-based source of data
 */

import Speedy from 'speedy-vision';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { Utils, Nullable } from '../utils/utils';
import { IllegalOperationError } from '../utils/errors';
import { Source } from './source';


/**
 * HTMLVideoElement-based source of data
 */
export class VideoSource implements Source
{
    /** video element */
    private _video: HTMLVideoElement;

    /** media source */
    protected _media: Nullable<SpeedyMedia>;



    /**
     * Constructor
     */
    constructor(video: HTMLVideoElement)
    {
        Utils.assert(video instanceof HTMLVideoElement, 'Expected a video element');

        this._video = video;
        this._media = null;
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
    get _stats(): string
    {
        const media = this._media;

        if(media != null)
            return `${media.width}x${media.height} video`;
        else
            return 'uninitialized video';
    }

    /**
     * Initialize this source of data
     * @returns a promise that resolves as soon as this source of data is initialized
     * @internal
     */
    _init(): SpeedyPromise<void>
    {
        this._handleBrowserPolicies(this._video);

        return Speedy.load(this._video).then(media => {
            Utils.log(`Source of data is a ${media.width}x${media.height} ${this._type}`);
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
     * Handle browser-specific policies for <video> elements
     * @param video
     * @internal
     */
    _handleBrowserPolicies(video: HTMLVideoElement): void
    {
        // WebKit <video> policies for iOS:
        // https://webkit.org/blog/6784/new-video-policies-for-ios/

        // required on iOS; nice to have in all browsers
        video.setAttribute('playsinline', '');

        // autoplay videos should be muted
        if(video.autoplay) {
            video.muted = true;
            video.addEventListener('canplay', () => {
                const p = video.play();
                if(typeof p === 'object') {
                    p.catch((error: DOMException) => {
                        Utils.error(`Can't autoplay video!`, error, video);

                        if(error.name == 'NotAllowedError') {
                            Utils.warning('Tip: allow manual playback');

                            if(Utils.isIOS())
                                Utils.warning('Is low power mode on?');
                        }
                    });
                }
            });
        }

        // Handle WebKit policies
        // note: navigator.vendor is deprecated. Alternatively, test GL_RENDERER == "Apple GPU"
        if(Utils.isIOS() || /Apple/.test(navigator.vendor)) {

            // on Epiphany, a hidden <video> shows up as a black screen when copied to a canvas
            if(video.hidden) {
                video.hidden = false;
                video.style.setProperty('opacity', '0');
                video.style.setProperty('position', 'absolute');
            }

        }
    }
}