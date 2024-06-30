/*
 * MARTINS.js
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
 * utils.ts
 * Generic utilities
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { AssertionError, IllegalArgumentError } from './errors';
import { Resolution, computeResolution } from '../core/resolution';

/**
 * Nullable type
 */
export type Nullable<T> = T | null;

/**
 * Generic utilities
 */
export class Utils
{
    /**
     * Log a message
     * @param message
     * @param args optional additional messages
     */
    static log(message: string, ...args: any[]): void
    {
        console.log('[martins-js]', message, ...args);
    }

    /**
     * Display a warning
     * @param message
     * @param args optional additional messages
     */
    static warning(message: string, ...args: any[]): void
    {
        console.warn('[martins-js]', message, ...args);
    }

    /**
     * Display an error message
     * @param message
     * @param args optional additional messages
     */
    static error(message: string, ...args: any[]): void
    {
        console.error('[martins-js]', message, ...args);
    }

    /**
     * Assertion
     * @param expr expression
     * @param errorMessage optional error message
     * @throws {AssertionError}
     */
    static assert(expr: boolean, errorMessage: string = ''): void
    {
        if(!expr)
            throw new AssertionError(errorMessage);
    }

    /**
     * Returns a range [0, 1, ..., n-1]
     * @param n non-negative integer
     * @returns range from 0 to n-1, inclusive
     */
    static range(n: number): number[]
    {
        if((n |= 0) < 0)
            throw new IllegalArgumentError();

        return Array.from({ length: n }, (_, i) => i);
    }

    /**
     * Convert a resolution type to a resolution measured in pixels
     * @param resolution resolution type
     * @param aspectRatio width / height ratio
     * @returns resolution measured in pixels
     */
    static resolution(resolution: Resolution, aspectRatio: number): SpeedySize
    {
        return computeResolution(resolution, aspectRatio);
    }

    /**
     * Returns a string containing platform brand information
     * @returns platform brand information
     */
    static platformString(): string
    {
        return ((navigator: any): string =>
            typeof navigator.userAgentData === 'object' ? // prefer the NavigatorUAData interface
            navigator.userAgentData.platform : // use only low entropy data
            navigator.platform // navigator.platform is deprecated
        )(navigator);
    }

    /**
     * Checks if we're on iOS
     * @returns true if we're on iOS
     */
    static isIOS(): boolean
    {
        // at the time of this writing, navigator.userAgentData is not yet
        // compatible with Safari. navigator.platform is deprecated, but
        // predictable.

        //if(/(iOS|iPhone|iPad|iPod)/i.test(Utils.platformString()))
        if(/(iOS|iPhone|iPad|iPod)/i.test(navigator.platform))
            return true;

        if(/Mac/i.test(navigator.platform) && navigator.maxTouchPoints !== undefined) // iPad OS 13+
            return navigator.maxTouchPoints > 2;

        return false;
    }

    /**
     * Checks if we're on a WebKit-based browser
     * @returns true if we're on a WebKit-based browser
     */
    static isWebKit(): boolean
    {
        // note: navigator.vendor is deprecated.
        if(/Apple/.test(navigator.vendor))
            return true;

        // Can a non WebKit-based browser pass this test?
        // Test masked GL_RENDERER == "Apple GPU" (valid since Feb 2020)
        // https://bugs.webkit.org/show_bug.cgi?id=207608
        /*if(Speedy.Platform.renderer == 'Apple GPU' && Speedy.Platform.vendor == 'Apple Inc.')
            return true;*/

        // Desktop and Mobile Safari, Epiphany on Linux
        if(/AppleWebKit\/.* Version\//.test(navigator.userAgent))
            return true;

        // Chrome, Firefox, Edge on iOS
        if(/(CriOS\/|FxiOS\/|EdgiOS\/)/.test(navigator.userAgent))
            return true;

        // not WebKit
        return false;
    }
}
