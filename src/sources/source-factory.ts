/*
 * MARTINS.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022  Alexandre Martins <alemartf(at)gmail.com>
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
 * source-factory.ts
 * Factory of sources of data
 */

import { VideoSource } from './video-source';
import { CanvasSource } from './canvas-source';
import { CameraSource, CameraSourceOptions } from './camera-source';


/**
 * Factory of sources of data
 */
export class SourceFactory
{
    /**
     * Create a <video>-based source of data
     * @param video video element
     */
    static Video(video: HTMLVideoElement): VideoSource
    {
        return new VideoSource(video);
    }

    /**
     * Create a <canvas>-based source of data
     * @param canvas canvas element
     */
    static Canvas(canvas: HTMLCanvasElement): CanvasSource
    {
        return new CanvasSource(canvas);
    }

    /**
     * Create a Webcam-based source of data
     * @param options optional options object
     */
    static Camera(options: CameraSourceOptions = {}): CameraSource
    {
        return new CameraSource(options);
    }
}