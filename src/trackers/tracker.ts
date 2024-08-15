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
 * tracker.ts
 * Abstract Tracker
 */

import { Session } from '../core/session';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';

/**
 * A Trackable is something that can be tracked
 */
export interface Trackable
{
}

/**
 * The result of a Tracker in a particular frame of a session. Such result is
 * meant to be consumed by the user/application.
 */
export interface TrackerResult
{
    /** the tracker that generated this result */
    readonly tracker: Tracker;

    /** an array of trackables (possibly empty) */
    readonly trackables: Trackable[];
}

/**
 * The output generated by a Tracker in a particular Frame of a Session
 */
export interface TrackerOutput
{
    /** tracker result to be consumed by the user */
    readonly exports?: TrackerResult;

    /** optional image for testing */
    readonly image?: SpeedyMedia;
}

/**
 * A Tracker is an AR subsystem attached to a Session
 */
export interface Tracker
{
    /** a string that identifies the type of the tracker */
    readonly type: string;

    /** initialize tracker @internal */
    _init: (session: Session) => SpeedyPromise<void>;

    /** release resources @internal */
    _release: () => SpeedyPromise<void>;

    /** update cycle @internal */
    _update: () => SpeedyPromise<void>;

    /** output of the last frame @internal */
    readonly _output: TrackerOutput;

    /** stats related to this tracker @internal */
    readonly _stats: string;
}