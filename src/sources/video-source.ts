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
import { IllegalOperationError, NotSupportedError } from '../utils/errors';
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
        this._handleBrowserQuirks(this._video);

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
     * Handle browser-specific quirks for <video> elements
     * @param video
     * @internal
     */
    _handleBrowserQuirks(video: HTMLVideoElement): void
    {
        // WebKit <video> policies for iOS:
        // https://webkit.org/blog/6784/new-video-policies-for-ios/

        // required on iOS; nice to have in all browsers
        video.setAttribute('playsinline', '');

        // handle autoplay
        if(video.autoplay)
            this._handleAutoPlay(video);

        // Handle WebKit quirks
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

    /**
     * Handle browser-specific quirks for videos marked with autoplay
     * @param video a <video> marked with autoplay
     * @internal
     */
    _handleAutoPlay(video: HTMLVideoElement): void
    {
        Utils.assert(video.autoplay);

        // videos marked with autoplay should be muted
        video.muted = true;

        // the browser may not honor the autoplay attribute if the video is not
        // visible on-screen. So, let's try to play the video in any case.
        video.addEventListener('canplay', () => {
            const promise = video.play();

            // handle older browsers
            if(typeof promise !== 'object')
                return;

            // can't play the video
            promise.catch((error: DOMException) => {
                Utils.error(`Can't autoplay video!`, error, video);

                // autoplay is blocked for some reason
                if(error.name == 'NotAllowedError') {
                    Utils.warning('Tip: allow manual playback');

                    if(Utils.isIOS())
                        Utils.warning('Is low power mode on?');

                    // User interaction is required to play the video. We can
                    // solve this here (easy and convenient to do) or at the
                    // application layer (for a better user experience). If the
                    // latter is preferred, just disable autoplay and play the
                    // video programatically.
                    if(video.hidden || !video.controls || video.parentNode === null) {
                        // this is added for convenience
                        document.body.addEventListener('pointerdown', () => video.play());
                        alert('Tap on the screen to start');
                    }
                }

                // unsupported media source
                else if(error.name == 'NotSupportedError')
                    throw new NotSupportedError('Unsupported video format', error);
            });
        });
    }
}