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
 * main.ts
 * Entry point
 */

import Speedy from 'speedy-vision';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { Settings } from './core/settings';
import { Session, SessionOptions } from './core/session';
import { TrackerFactory } from './trackers/tracker-factory';
import { SourceFactory } from './sources/source-factory';
import { Viewport as _Viewport, ViewportSettings } from './core/viewport';
import { Vector2 as _Vector2 } from './geometry/vector2';
import { Vector3 as _Vector3 } from './geometry/vector3';
import { Utils } from './utils/utils';

declare const __AR_WEBSITE__: string;

// Display a notice
Utils.log(
    `encantar.js version ${Utils.engineVersion}. ` +
    `GPU-accelerated Augmented Reality for the web by Alexandre Martins. ` +
    __AR_WEBSITE__
);

/**
 * Start a new session
 * @param options
 * @returns a promise that resolves to a new session
 */
export function startSession(options?: SessionOptions): SpeedyPromise<Session>
{
    return Session.instantiate(options);
}

/**
 * Checks if the engine can be run in the browser the client is using
 * @returns true if the engine is compatible with the browser
 */
export function isSupported(): boolean
{
    return Session.isSupported();
}

/**
 * Engine version
 */
export const version = Utils.engineVersion;

/**
 * Global Settings
 */
export { Settings };

/**
 * Speedy Vision
 */
export { Speedy };

/**
 * Trackers
 */
export const Tracker = TrackerFactory;

/**
 * Sources of data
 */
export const Source = SourceFactory;

/**
 * Create a viewport
 * @param settings
 * @returns a new viewport with the specified settings
 */
export function Viewport(settings: ViewportSettings): _Viewport
{
    return new _Viewport(settings);
}

/**
 * Create a new 2D vector
 * @param x x-coordinate
 * @param y y-coordinate
 * @returns a new 2D vector with the provided coordinates
 */
export function Vector2(x: number, y: number): _Vector2
{
    return new _Vector2(x, y);
}

/**
 * Create a new 3D vector
 * @param x x-coordinate
 * @param y y-coordinate
 * @param z z-coordinate
 * @returns a new 3D vector with the provided coordinates
 */
export function Vector3(x: number, y: number, z: number): _Vector3
{
    return new _Vector3(x, y, z);
}

// ----------------------------------------------------------------------------

/**
 * This utility lets you create an object of
 * class T writing t = T(x) or t = new T(x)
 * @returns a type/factory hybrid
 * @internal
 */
/*
function MakeFactory<T>(clazz: new (...args: any[]) => T)
{
    return new Proxy(clazz, {
        apply(target, self, args) { return Reflect.construct(target, args); }
    }) as typeof clazz & ((...args: any[]) => T);
}
export const Vector2 = MakeFactory(_Vector2) as typeof _Vector2 & ((x: number, y: number) => _Vector2);
export const Vector3 = MakeFactory(_Vector3) as typeof _Vector3 & ((x: number, y: number, z: number) => _Vector3);
*/
