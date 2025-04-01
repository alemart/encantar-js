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
 * vector2.ts
 * 2D vectors
 */

import { Nullable } from '../utils/utils';

/** Small number */
const EPSILON = 1e-6;

/** Immutable zero vector */
let ZERO: Nullable<Vector2> = null;

// public / non-internal methods do not change the contents of the vector



/**
 * A vector in 2D space
 */
export class Vector2
{
    /** x coordinate */
    private _x: number;

    /** y coordinate */
    private _y: number;





    /**
     * Constructor
     */
    constructor(x: number = 0, y: number = 0)
    {
        this._x = +x;
        this._y = +y;
    }

    /**
     * Instantiate a zero vector
     * @returns a new zero vector
     */
    static Zero(): Vector2
    {
        return new Vector2(0, 0);
    }

    /**
     * Immutable zero vector
     * @returns an immutable zero vector
     */
    static get ZERO(): Vector2
    {
        return ZERO || (ZERO = Object.freeze(Vector2.Zero()) as Vector2);
    }

    /**
     * The x coordinate of the vector
     */
    get x(): number
    {
        return this._x;
    }

    /**
     * The y coordinate of the vector
     */
    get y(): number
    {
        return this._y;
    }

    /**
     * The length of this vector
     * @returns sqrt(x^2 + y^2)
     */
    length(): number
    {
        const x = this._x;
        const y = this._y;

        return Math.sqrt(x*x + y*y);
    }

    /**
     * Compute the dot product of this and v
     * @param v a vector
     * @returns the dot product of the vectors
     */
    dot(v: Vector2): number
    {
        return this._x * v._x + this._y * v._y;
    }

    /**
     * Compute the distance between points this and v
     * @param v a vector / point
     * @returns the distance between the points
     */
    distanceTo(v: Vector2): number
    {
        const dx = this._x - v._x;
        const dy = this._y - v._y;

        return Math.sqrt(dx*dx + dy*dy);
    }

    /**
     * Compute the direction from this to v
     * @param v a vector
     * @returns a new unit vector pointing to v from this
     */
    directionTo(v: Vector2): Vector2
    {
        return v._clone()._subtract(this)._normalize();
    }

    /**
     * Compute a unit vector with the same direction as this
     * @returns a new unit vector with the same direction as this
     */
    normalized(): Vector2
    {
        return this._clone()._normalize();
    }

    /**
     * Compute the sum between this vector and v
     * @param v a vector
     * @returns a new vector equal to the sum between this and v
     */
    plus(v: Vector2): Vector2
    {
        return this._clone()._add(v);
    }

    /**
     * Compute the difference between this vector and v
     * @param v a vector
     * @returns a new vector equal to the difference this - v
     */
    minus(v: Vector2): Vector2
    {
        return this._clone()._subtract(v);
    }

    /**
     * Compute the multiplication between this vector and a scale factor
     * @param scale scalar quantity
     * @returns a new vector equal to the multiplication between this and the scale factor
     */
    times(scale: number): Vector2
    {
        return this._clone()._scale(scale);
    }

    /**
     * Check if this and v have the same coordinates
     * @param v a vector
     * @returns true if this and v have the same coordinates
     */
    equals(v: Vector2): boolean
    {
        return this._x === v._x && this._y === v._y;
    }

    /**
     * Convert to string
     * @returns a string
     */
    toString(): string
    {
        const x = this._x.toFixed(5);
        const y = this._y.toFixed(5);

        return `Vector2(${x},${y})`;
    }

    /**
     * Set the coordinates of this vector
     * @param x x-coordinate
     * @param y y-coordinate
     * @returns this vector
     * @internal
     */
    _set(x: number, y: number): Vector2
    {
        this._x = +x;
        this._y = +y;

        return this;
    }

    /**
     * Copy v to this vector
     * @param v a vector
     * @returns this vector
     * @internal
     */
    _copyFrom(v: Vector2): Vector2
    {
        this._x = v._x;
        this._y = v._y;

        return this;
    }

    /**
     * Normalize this vector
     * @returns this vector, normalized
     * @internal
     */
    _normalize(): Vector2
    {
        const length = this.length();

        if(length < EPSILON) // zero?
            return this;

        this._x /= length;
        this._y /= length;

        return this;
    }

    /**
     * Add v to this vector
     * @param v a vector
     * @returns this vector
     * @internal
     */
    _add(v: Vector2): Vector2
    {
        this._x += v._x;
        this._y += v._y;

        return this;
    }

    /**
     * Subtract v from this vector
     * @param v a vector
     * @returns this vector
     * @internal
     */
    _subtract(v: Vector2): Vector2
    {
        this._x -= v._x;
        this._y -= v._y;

        return this;
    }

    /**
     * Scale this vector by a scalar
     * @param s scalar
     * @returns this vector
     * @internal
     */
    _scale(s: number): Vector2
    {
        this._x *= s;
        this._y *= s;

        return this;
    }

    /**
     * Clone this vector
     * @returns a clone of this vector
     * @internal
     */
    _clone(): Vector2
    {
        return new Vector2(this._x, this._y);
    }
}
