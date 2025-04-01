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
 * utils.ts
 * Generic utilities
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { AssertionError, IllegalArgumentError } from './errors';
import { Resolution, computeResolution } from './resolution';

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
        console.log('[encantar-js]', message, ...args);
    }

    /**
     * Display a warning
     * @param message
     * @param args optional additional messages
     */
    static warning(message: string, ...args: any[]): void
    {
        console.warn('[encantar-js]', message, ...args);
    }

    /**
     * Display an error message
     * @param message
     * @param args optional additional messages
     */
    static error(message: string, ...args: any[]): void
    {
        console.error('[encantar-js]', message, ...args);
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
     * Generate the range [0, 1, ..., n-1]
     * @param n non-negative integer
     * @returns range from 0 to n-1, inclusive, as a new array
     */
    static range(n: number): number[]
    {
        if((n |= 0) < 0)
            throw new IllegalArgumentError();

        return Array.from({ length: n }, (_, i) => i);
    }

    /**
     * Shuffle an array
     * @param arr array to be shuffled in-place
     * @returns shuffled arr
     */
    static shuffle<T>(arr: T[]): T[]
    {
        // Fisher-Yattes shuffle
        for(let i = arr.length - 1; i >= 1; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // 0 <= j <= i
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }

        return arr;
    }

    /**
     * Wait a few milliseconds
     * @param milliseconds how long should we wait?
     * @returns a promise that is resolved soon after the specified time
     */
    static wait(milliseconds: number): SpeedyPromise<void>
    {
        return new Speedy.Promise<void>(resolve => {
            setTimeout(resolve, milliseconds);
        });
    }

    /**
     * Run SpeedyPromises sequentially
     * @param promises an array of SpeedyPromises
     * @returns a promise that is resolved as soon as all input promises are
     * resolved, or that is rejected as soon as an input promise is rejected
     */
    static runInSequence<T>(promises: SpeedyPromise<T>[]): SpeedyPromise<T>
    {
        return promises.reduce(
            (prev, curr) => prev.then(() => curr),
            Speedy.Promise.resolve()
        );
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
        // note: navigator.vendor is deprecated
        if(/Apple/.test(navigator.vendor))
            return true;

        // Can a non WebKit-based browser pass this test?
        // Test masked GL_RENDERER == "Apple GPU" (valid since Feb 2020)
        // https://bugs.webkit.org/show_bug.cgi?id=207608
        /*
        if(Speedy.Platform.renderer == 'Apple GPU' && Speedy.Platform.vendor == 'Apple Inc.')
            return true;
        */

        // Desktop and Mobile Safari, Epiphany on Linux
        if(/AppleWebKit\/.* Version\//.test(navigator.userAgent))
            return true;

        // Chrome, Firefox, Edge on iOS
        if(/(CriOS\/|FxiOS\/|EdgiOS\/)/.test(navigator.userAgent))
            return true;

        // not WebKit
        return false;
    }

    /**
     * Device-specific information for debugging purposes
     */
    static deviceInfo(): string
    {
        return 'Device info: ' + JSON.stringify({
            isIOS: Utils.isIOS(),
            isWebKit: Utils.isWebKit(),
            renderer: Speedy.Platform.renderer,
            vendor: Speedy.Platform.vendor,
            screen: [screen.width, screen.height].join('x'),
            platform: [navigator.platform, navigator.vendor].join('; '),
            userAgent: navigator.userAgent,
            userAgentData: (navigator as any).userAgentData || null,
        }, null, 2);
    }
}
