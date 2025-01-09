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
 * camera-source.ts
 * Webcam-based source of data
 */

import Speedy from 'speedy-vision';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { Utils } from '../utils/utils';
import { Resolution } from '../utils/resolution';
import { NotSupportedError, AccessDeniedError, IllegalOperationError } from '../utils/errors';
import { VideoSource } from './video-source';


/**
 * Options for spawning a Webcam-based source of data
 */
export interface CameraSourceOptions
{
    /** resolution type for the captured images */
    resolution?: Resolution;

    /** a hint for the desired aspect ratio */
    aspectRatio?: number;

    /** additional video constraints to be passed to navigator.mediaDevices.getUserMedia() */
    constraints?: MediaTrackConstraints;
}

/** Default options for camera sources */
const DEFAULT_CAMERA_OPTIONS: Readonly<Required<CameraSourceOptions>> = {
    resolution: 'md',
    aspectRatio: 16/9,
    constraints: { facingMode: 'environment' },
};



/**
 * Webcam-based source of data
 */
export class CameraSource extends VideoSource
{
    /** Options of the constructor */
    private _options: Required<CameraSourceOptions>;



    /**
     * Constructor
     * @param options
     */
    constructor(options: CameraSourceOptions)
    {
        const video = document.createElement('video');

        super(video);
        this._options = Object.assign({}, DEFAULT_CAMERA_OPTIONS, options);
    }

    /**
     * Camera resolution
     */
    get resolution(): Resolution
    {
        return this._options.resolution;
    }

    /**
     * Initialize this source of data
     * @returns a promise that resolves as soon as this source of data is initialized
     * @internal
     */
    _init(): SpeedyPromise<void>
    {
        Utils.log('Accessing the webcam...');

        // validate
        if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
            throw new NotSupportedError('Unsupported browser: no navigator.mediaDevices.getUserMedia()');

        // set up media constraints
        const options = this._options;
        const size = Utils.resolution(options.resolution, options.aspectRatio);
        const constraints: MediaStreamConstraints = {
            audio: false,
            video: {
                width: size.width,
                height: size.height,
                aspectRatio: options.aspectRatio,
                ...options.constraints,
            }
        };

        // load camera stream
        return new Speedy.Promise<HTMLVideoElement>((resolve, reject) => {
            navigator.mediaDevices.getUserMedia(constraints).then(stream => {
                const video = this.video;
                video.onloadedmetadata = () => {
                    const promise = video.play();
                    const success = 'Access to the webcam has been granted.';

                    // handle older browsers
                    if(promise === undefined) {
                        Utils.log(success);
                        resolve(video);
                        return;
                    }

                    // handle promise
                    promise.then(() => {
                        Utils.log(success);
                        resolve(video);
                    }).catch(error => {
                        reject(new IllegalOperationError(
                            'Webcam error!',
                            error
                        ));
                    });
                };
                video.setAttribute('playsinline', '');
                video.setAttribute('autoplay', '');
                video.setAttribute('muted', '');
                video.srcObject = stream;
            }).catch(error => {
                reject(new AccessDeniedError(
                    'Please give access to the webcam and reload the page.',
                    error
                ));
            });
        }).then(_ => super._init()); // this will handle browser quirks
    }

    /**
     * Release this source of data
     * @returns a promise that resolves as soon as this source of data is released
     * @internal
     */
    _release(): SpeedyPromise<void>
    {
        const video = this.video;
        const stream = video.srcObject as MediaStream;
        const tracks = stream.getTracks();

        // stop camera feed
        tracks.forEach(track => track.stop());
        video.onloadedmetadata = null;
        video.srcObject = null;

        // release the media
        return super._release();
    }
}