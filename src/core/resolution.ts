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
 * resolution.ts
 * Resolution utilities
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';

/** Resolution type */
export type Resolution = 'xs' | 'xs+' | 'sm' | 'sm+' | 'md' | 'md+' | 'lg' | 'lg+';

/** Reference heights when in landscape mode, measured in pixels */
const REFERENCE_HEIGHT: { readonly [R in Resolution]: number } = {
    'xs' : 120,
    'xs+': 160,
    'sm' : 200,
    'sm+': 240,
    'md' : 320,
    'md+': 360,
    'lg' : 480,
    'lg+': 600,
};

/**
 * Convert a resolution type to a (width, height) pair
 * @param resolution resolution type
 * @param aspectRatio desired width / height ratio
 * @returns size in pixels
 */
export function computeResolution(resolution: Resolution, aspectRatio: number): SpeedySize
{
    const referenceHeight = REFERENCE_HEIGHT[resolution];
    let width = 0, height = 0;

    if(aspectRatio >= 1) {
        // landscape
        height = referenceHeight;
        width = Math.round(height * aspectRatio);
        width -= width % 2;
    }
    else {
        // portrait
        width = referenceHeight;
        height = Math.round(width / aspectRatio);
        height -= height % 2;
    }

    return Speedy.Size(width, height);
}