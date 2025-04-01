/*
 * encantar.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022-2025 Alexandre Martins <alemartf(at)gmail.com>
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
 * pose.ts
 * A pose represents a position and an orientation in 3D space
 */

import { Transform } from './transform';



/**
 * A pose represents a position and an orientation in 3D space
 */
export class Pose
{
    /** Internal transform */
    private _transform: Transform;



    /**
     * Constructor
     * @param transform usually a rigid transform in a 3D space (e.g., world space, viewer space or other)
     */
    constructor(transform: Transform)
    {
        this._transform = transform;
    }

    /**
     * A transform describing the position and the orientation
     * of the pose relative to the 3D space to which it belongs
     */
    get transform(): Transform
    {
        return this._transform;
    }
}
