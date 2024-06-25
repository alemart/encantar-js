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
 * time.ts
 * Time utilities
 */

/**
 * Time Manager
 */
export class Time
{
    /** time scale */
    private _scale: number = 1;

    /** time since the start of the session, in milliseconds */
    private _time: DOMHighResTimeStamp = 0;

    /** unscaled time since the start of the session, in milliseconds */
    private _unscaledTime: DOMHighResTimeStamp = 0;

    /** elapsed time between the current and the previous frame, in milliseconds */
    private _delta: DOMHighResTimeStamp = 0;

    /** time of the first update call, in milliseconds */
    private _firstUpdate: DOMHighResTimeStamp = 0;

    /** time of the last update call, in milliseconds */
    private _lastUpdate: DOMHighResTimeStamp = Number.POSITIVE_INFINITY;



    /**
     * Update the Time Manager
     * @param timestamp in milliseconds
     * @internal
     */
    _update(timestamp: DOMHighResTimeStamp): void
    {
        if(timestamp < this._lastUpdate) {
            this._firstUpdate = this._lastUpdate = timestamp;
            return;
        }

        this._delta = (timestamp - this._lastUpdate) * this._scale;
        this._time += this._delta;
        this._unscaledTime = timestamp - this._firstUpdate;
        this._lastUpdate = timestamp;
    }

    /**
     * Elapsed time since the start of the session, measured at the
     * beginning of the current animation frame and given in seconds
     */
    get elapsed(): number
    {
        return this._time * 0.001;
    }

    /**
     * Elapsed time between the current and the previous animation
     * frame, given in seconds
     */
    get delta(): number
    {
        return this._delta * 0.001;
    }

    /**
     * Time scale (defaults to 1)
     */
    get scale(): number
    {
        return this._scale;
    }

    /**
     * Time scale (defaults to 1)
     */
    set scale(scale: number)
    {
        this._scale = Math.max(0, +scale);
    }

    /**
     * Time scale independent elapsed time since the start of the session,
     * measured at the beginning of the current animation frame and given
     * in seconds
     */
    get unscaled(): number
    {
        return this._unscaledTime * 0.001;
    }
}