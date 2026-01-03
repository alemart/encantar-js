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
 * resolution.ts
 * Resolution utilities
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { IllegalArgumentError } from './errors';

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type EvenDigit = '0' | '2' | '4' | '6' | '8';
type PositiveDigit = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type OptionalDigit = Digit | '';
type CustomResolution = `${PositiveDigit}${OptionalDigit}${Digit}${EvenDigit}p`;
type ResolutionAlias = 'xs' | 'xs+' | 'sm' | 'sm+' | 'md' | 'md+' | 'lg' | 'lg+' | 'xl' | 'xl+' | 'xxl';

/** Resolution type */
export type Resolution = ResolutionAlias | CustomResolution;

/** A regex that identifies custom resolutions */
const CUSTOM_RESOLUTION_REGEX = /^[1-9][0-9]?[0-9][02468]p$/;

/** Reference heights when in landscape mode, measured in pixels, for all aliases */
const ALIAS_TO_HEIGHT: { readonly [R in ResolutionAlias]: number } = {
    'xs' : 120,
    'xs+': 144,
    'sm' : 240,
    'sm+': 288,
    'md' : 320,
    'md+': 360,
    'lg' : 480,
    'lg+': 600,
    'xl' : 720,
    'xl+': 900,
    'xxl': 1080,
};

/**
 * Convert a resolution type to a (width, height) pair
 * @param resolution resolution type
 * @param aspectRatio desired width / height ratio
 * @returns size in pixels
 */
export function computeResolution(resolution: Resolution, aspectRatio: number): SpeedySize
{
    const referenceHeight = parseHeight(resolution);
    let width = 0, height = 0;

    if(Number.isNaN(referenceHeight))
        throw new IllegalArgumentError('Invalid resolution: ' + resolution);
    else if(aspectRatio <= 0)
        throw new IllegalArgumentError('Invalid aspect ratio: ' + aspectRatio);

    if(aspectRatio >= 1) {
        // landscape
        height = referenceHeight;
        width = Math.floor(height * aspectRatio);
        width += width % 2;
    }
    else {
        // portrait
        width = referenceHeight;
        height = Math.floor(width / aspectRatio);
        height += height % 2;
    }

    return Speedy.Size(width, height);
}

/**
 * Get the height in pixels of a resolution
 * @param resolution resolution type
 * @returns the height in pixels, or NaN on error
 */
function parseHeight(resolution: Resolution): number
{
    if(ALIAS_TO_HEIGHT.hasOwnProperty(resolution))
        return ALIAS_TO_HEIGHT[resolution as ResolutionAlias];

    //if(CUSTOM_RESOLUTION_REGEX.test(resolution)) // really needed? is it fast?
    if(resolution.endsWith('p')) {
        const r = resolution[0];
        if(r >= '1' && r <= '9')
            return parseInt(resolution);
    }

    return Number.NaN;
}