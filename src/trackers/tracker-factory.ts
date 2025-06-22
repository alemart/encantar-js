/*
 * encantar.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022-2025 Alexandre Martins <alemartf(at)gmail.com>
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
 * tracker-factory.ts
 * Tracker factory
 */

import { ImageTracker, ImageTrackerOptions } from './image-tracker/image-tracker';
import { PointerTracker, PointerTrackerOptions } from './pointer-tracker/pointer-tracker';

/**
 * Tracker factory
 */
export class TrackerFactory
{
    /**
     * Create an Image Tracker
     * @param options
     */
    static Image(options: ImageTrackerOptions = {}): ImageTracker
    {
        return new ImageTracker(options);
    }

    /**
     * Create an Image Tracker with default settings
     * @deprecated use Image() instead
     */
    static ImageTracker(): ImageTracker
    {
        return this.Image();
    }

    /**
     * Create a Pointer Tracker
     * @param options
     */
    static Pointer(options: PointerTrackerOptions = {}): PointerTracker
    {
        return new PointerTracker(options);
    }
}
