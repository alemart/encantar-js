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
 * utils.ts
 * Generic utilities
 */

import { AssertionError, IllegalArgumentError } from './errors';
import { Resolution, computeResolution } from '../core/resolution';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';

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
    static log(message: string, ...args: string[]): void
    {
        console.log('[martins-js]', message, ...args);
    }

    /**
     * Display a warning
     * @param message
     * @param args optional additional messages
     */
    static warning(message: string, ...args: string[]): void
    {
        console.warn('[martins-js]', message, ...args);
    }

    /**
     * Display an error message
     * @param message
     * @param args optional additional messages
     */
    static error(message: string, ...args: string[]): void
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
}