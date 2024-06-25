/*
 * MARTINS.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022  Alexandre Martins <alemartf(at)gmail.com>
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
import { IllegalArgumentError } from '../utils/errors';

/**
 * Iterable frame results (helper class)
 */
class IterableTrackerResults implements IterableIterator<TrackerResult>
{
    private _index = 0;

    constructor(private readonly _results: TrackerResult[])
    {
    }

    next(): IteratorResult<TrackerResult>
    {
        const i = this._index++;
        return i < this._results.length ?
            { done: false, value: this._results[i] } :
            { done: true,  value: undefined };
    }

    [Symbol.iterator](): IterableIterator<TrackerResult>
    {
        return this;
    }
}

/**
 * A Frame holds information used to render a single animation frame of a Session
 */
export class Frame
{
    /** A reference to the session */
    private readonly _session: Session;

    /** Results of all trackers (in the current frame) */
    private readonly _results: IterableTrackerResults;



    /**
     * Constructor
     * @param session
     * @param results
     */
    constructor(session: Session, results: TrackerResult[])
    {
        this._session = session;
        this._results = new IterableTrackerResults(results);
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
        return this._results;
    }
}