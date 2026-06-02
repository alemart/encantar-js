/*
 * encantar.js
 * GPU-accelerated Augmented Reality library for the web
 * Copyright (C) 2022-2026 Alexandre Martins <alemartf(at)gmail.com>
 *
 * This library is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library.  If not, see <https://www.gnu.org/licenses/>.
 *
 * metadata.ts
 * Project metadata
 */

declare const __AR_FLAGS__  : string;
declare const __AR_VERSION__: string;
declare const __AR_WEBSITE__: string;

/** Compile-time flags */
export const AR_FLAGS: number = (typeof __AR_FLAGS__ !== 'undefined') ? Number(__AR_FLAGS__) : 0;

/** Version of the library */
export const AR_VERSION: string = (typeof __AR_VERSION__ !== 'undefined') ? String(__AR_VERSION__) : '0.0.0-unknown';

/** Website of the library */
export const AR_WEBSITE: string = (typeof __AR_WEBSITE__ !== 'undefined') ? String(__AR_WEBSITE__) : 'https://github.com/alemart/encantar-js';
