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
import { Viewport, ViewportSettings } from './core/viewport';
import { Vector2 } from './geometry/vector2';
import { Vector3 } from './geometry/vector3';
import { Utils } from './utils/utils';

declare const __AR_VERSION__: string;
declare const __AR_WEBSITE__: string;

/**
 * GPU-accelerated Augmented Reality for the web
 */
export class AR
{
    /**
     * Start a new session
     * @param options
     * @returns a promise that resolves to a new session
     */
    static startSession(options?: SessionOptions): SpeedyPromise<Session>
    {
        return Session.instantiate(options);
    }

    /**
     * Checks if the engine can be run in the browser the client is using
     * @returns true if the engine is compatible with the browser
     */
    static isSupported(): boolean
    {
        return Session.isSupported();
    }

    /**
     * Engine version
     */
    static get version(): string
    {
        return __AR_VERSION__;
    }

    /**
     * Speedy Vision
     */
    static get Speedy(): typeof Speedy
    {
        return Speedy;
    }

    /**
     * Trackers
     */
    static get Tracker(): typeof TrackerFactory
    {
        return TrackerFactory;
    }

    /**
     * Sources of data
     */
    static get Source(): typeof SourceFactory
    {
        return SourceFactory;
    }

    /**
     * Create a viewport
     * @param settings
     * @returns a new viewport with the specified settings
     */
    static Viewport(settings: ViewportSettings): Viewport
    {
        return new Viewport(settings);
    }

    /**
     * Create a new 2D vector
     * @param x x-coordinate
     * @param y y-coordinate
     * @returns a new 2D vector with the provided coordinates
     */
    static Vector2(x: number, y: number): Vector2
    {
        return new Vector2(x, y);
    }

    /**
     * Create a new 3D vector
     * @param x x-coordinate
     * @param y y-coordinate
     * @param z z-coordinate
     * @returns a new 3D vector with the provided coordinates
     */
    static Vector3(x: number, y: number, z: number): Vector3
    {
        return new Vector3(x, y, z);
    }

    /**
     * Global Settings
     */
    static get Settings(): typeof Settings
    {
        return Settings;
    }
}

// Freeze the namespace
Object.freeze(AR);

// Display a notice
Utils.log(
    `encantar.js version ${AR.version}. ` +
    `GPU-accelerated Augmented Reality for the web by Alexandre Martins. ` +
    __AR_WEBSITE__
);