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
 * trackable-pointer.ts
 * A trackable representing an instance of pointer-based input
 */

import { Trackable } from '../tracker';
import { Vector2 } from '../../geometry/vector2';

/**
 * The phase of a TrackablePointer. Possible values:
 * - "began": the tracking began in this frame (e.g., a finger has just touched the screen)
 * - "stationary": the user did not move the pointer in this frame
 * - "moved": the user moved the pointer in this frame
 * - "ended": the tracking ended in this frame (e.g., a finger has just been lifted from the screen)
 * - "canceled": the tracking was canceled in this frame (e.g., the screen orientation of the device has just been changed)
 */
export type TrackablePointerPhase = 'began' | 'moved' | 'stationary' | 'ended' | 'canceled';

/**
 * A trackable representing an instance of pointer-based input
 */
export interface TrackablePointer extends Trackable
{
    /** a unique identifier assigned to this pointer */
    readonly id: number;

    /** the phase of the pointer */
    readonly phase: TrackablePointerPhase;

    /** current position in normalized units [-1,1]x[-1,1] */
    readonly position: Vector2;

    /** the difference between the position of the pointer in this and in the previous frame */
    readonly deltaPosition: Vector2;

    /** the position of the pointer when its tracking began */
    readonly initialPosition: Vector2;

    /** current velocity, given in normalized units per second */
    readonly velocity: Vector2;

    /** elapsed time, in seconds, since the tracking of this pointer began */
    readonly elapsedTime: number;

    /** whether or not this is the primary pointer for this type */
    readonly isPrimary: boolean;

    /** the type of the originating device; typically "mouse", "touch" or "pen" */
    readonly type: string;
}
