/*
 * encantar.js
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
 * stats.ts
 * Stats for performance measurements
 */

/** update interval, given in seconds */
const UPDATE_INTERVAL = 0.5;

/**
 * Stats for performance measurements
 */
export class Stats
{
    private _timeOfLastUpdate: number;
    private _partialCycleCount: number;
    private _cyclesPerSecond: number;

    /**
     * Constructor
     */
    constructor()
    {
        this._timeOfLastUpdate = this._now();
        this._partialCycleCount = 0;
        this._cyclesPerSecond = 0;
    }

    /**
     * Update stats - call every frame
     */
    update(): void
    {
        const now = this._now();

        ++this._partialCycleCount;
        if(now >= this._timeOfLastUpdate + 1000 * UPDATE_INTERVAL) {
            this._cyclesPerSecond = this._partialCycleCount / UPDATE_INTERVAL;
            this._partialCycleCount = 0;
            this._timeOfLastUpdate = now;
        }
    }

    /**
     * Reset stats
     */
    reset(): void
    {
        this._timeOfLastUpdate = this._now();
        this._partialCycleCount = 0;
        this._cyclesPerSecond = 0;
    }

    /**
     * Number of cycles per second
     */
    get cyclesPerSecond(): number
    {
        return this._cyclesPerSecond;
    }

    /**
     * A measurement of time, in milliseconds
     * @returns time in ms
     */
    private _now(): number
    {
        return performance.now();
    }
}

