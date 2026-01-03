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
 * frame.ts
 * A Frame holds information used to render a single animation frame of a Session
 */

import { Session } from './session';
import { TrackerResult } from '../trackers/tracker';

/**
 * A Frame holds information used to render a single animation frame of a Session
 */
export class Frame
{
    /** A reference to the session */
    private readonly _session: Session;

    /** Results of all trackers (in the current frame) */
    private readonly _results: TrackerResult[];



    /**
     * Constructor
     * @param session
     * @param results
     */
    constructor(session: Session, results: TrackerResult[])
    {
        this._session = session;
        this._results = results;
    }

    /**
     * The session of which this frame holds data
     */
    get session(): Session
    {
        return this._session;
    }

    /**
     * The results of all trackers in this frame
     */
    get results(): Iterable<TrackerResult>
    {
        // we want to be able to iterate over the results of a frame multiple times
        return this._results[Symbol.iterator]();
    }
}