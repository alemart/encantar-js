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
import { IllegalOperationError, NotSupportedError, TimeoutError } from '../utils/errors';
import { Source } from './source';

/** A message to be displayed if a video can't autoplay and user interaction is required */
const ALERT_MESSAGE = 'Tap on the screen to start';

/** Whether or not we have displayed the ALERT_MESSAGE */
let displayedAlertMessage = false;


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
        return Speedy.load(this._video).then(media => {
            Utils.log(`Source of data is a ${media.width}x${media.height} ${this._type}`);
            this._media = media;
            return this._handleBrowserQuirks(this._video).then(() => void(0));
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
     * @param video a video element
     * @returns a promise that resolves to the input video
     * @internal
     */
    _handleBrowserQuirks(video: HTMLVideoElement): SpeedyPromise<HTMLVideoElement>
    {
        // WebKit <video> policies for iOS:
        // https://webkit.org/blog/6784/new-video-policies-for-ios/

        // required on iOS; nice to have in all browsers
        video.setAttribute('playsinline', '');

        // handle autoplay
        return this._handleAutoPlay(video).then(video => {

            // handle WebKit quirks
            // note: navigator.vendor is deprecated. Alternatively, test GL_RENDERER == "Apple GPU"
            if(Utils.isIOS() || /Apple/.test(navigator.vendor)) {

                // on Epiphany, a hidden <video> shows up as a black screen when copied to a canvas
                if(video.hidden) {
                    video.hidden = false;
                    video.style.setProperty('opacity', '0');
                    video.style.setProperty('position', 'absolute');
                }

            }

            // done
            return video;

        });
    }

    /**
     * Handle browser-specific quirks for videos marked with autoplay
     * @param video a <video> marked with autoplay
     * @returns a promise that resolves to the input video
     * @internal
     */
    _handleAutoPlay(video: HTMLVideoElement): SpeedyPromise<HTMLVideoElement>
    {
        // Autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide
        // Chrome policy: https://developer.chrome.com/blog/autoplay/
        // WebKit policy: https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/

        // nothing to do?
        if(!video.autoplay)
            return Speedy.Promise.resolve(video);

        // videos marked with autoplay should be muted
        video.muted = true;

        // the browser may not honor the autoplay attribute if the video is not
        // visible on-screen. So, let's try to play the video in any case.
        return this._waitUntilPlayable(video).then(video => {

            // try to play the video
            const promise = video.play();

            // handle older browsers
            if(promise === undefined)
                return video;

            // resolve if successful
            return new Speedy.Promise<HTMLVideoElement>((resolve, reject) => {
                promise.then(() => resolve(video), error => {
                    // can't play the video
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

                            // ask only once for user interaction
                            if(!displayedAlertMessage) {
                                alert(ALERT_MESSAGE);
                                displayedAlertMessage = true;
                            }

                            // XXX what if the Session mode is inline? In this
                            // case, this convenience code may be undesirable.
                            // A workaround is to disable autoplay.

                        }
                        /*else {
                            // play the video after the first interaction with the page
                            const polling = setInterval(() => {
                                video.play().then(() => clearInterval(polling));
                            }, 500);
                        }*/
                    }

                    // unsupported media source
                    else if(error.name == 'NotSupportedError') {
                        reject(new NotSupportedError('Unsupported video format', error));
                        return;
                    }

                    // done
                    resolve(video);
                });
            });
        });
    }

    /**
     * Wait for the input video to be playable
     * @param video
     * @returns a promise that resolves to the input video when it can be played through to the end
     * @internal
     */
    _waitUntilPlayable(video: HTMLVideoElement): SpeedyPromise<HTMLVideoElement>
    {
        const TIMEOUT = 15000, INTERVAL = 500;

        if(video.readyState >= 4)
            return Speedy.Promise.resolve(video);

        return new Speedy.Promise<HTMLVideoElement>((resolve, reject) => {
            let ms = 0, t = setInterval(() => {

                if(video.readyState >= 4) { // canplaythrough
                    clearInterval(t);
                    resolve(video);
                }
                else if((ms += INTERVAL) > TIMEOUT) {
                    reject(new TimeoutError('The video took too long to load'));
                }

            }, INTERVAL);
        });
    }
}