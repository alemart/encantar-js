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
 * ray.ts
 * Rays
 */

import { Vector3 } from './vector3';


/**
 * A ray with origin and direction
 */
export class Ray
{
    /** origin of the ray, a point */
    private _origin: Vector3;

    /** direction, a unit vector */
    private _direction: Vector3;



    /**
     * Constructor
     * @param origin a point
     * @param direction a unit vector
     */
    constructor(origin: Vector3, direction: Vector3)
    {
        this._origin = origin;
        this._direction = direction;
    }

    /**
     * The origin point of the ray
     */
    get origin(): Vector3
    {
        return this._origin;
    }

    /**
     * The direction of the ray, a unit vector
     */
    get direction(): Vector3
    {
        return this._direction;
    }
}
