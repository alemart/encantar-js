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
 * vector3.ts
 * 3D vectors
 */

/** Small number */
const EPSILON = 1e-6;

// public / non-internal methods do not change the contents of the vector



/**
 * A vector in 3D space
 */
export class Vector3
{
    /** x coordinate */
    public x: number;

    /** y coordinate */
    public y: number;

    /** z coordinate */
    public z: number;



    /**
     * Constructor
     */
    constructor(x: number = 0, y: number = 0, z: number = 0)
    {
        this.x = +x;
        this.y = +y;
        this.z = +z;
    }

    /**
     * Instantiate a zero vector
     * @returns a new zero vector
     */
    static Zero(): Vector3
    {
        return new Vector3(0, 0, 0);
    }

    /**
     * The length of this vector
     * @returns sqrt(x^2 + y^2 + z^2)
     */
    length(): number
    {
        const x = this.x;
        const y = this.y;
        const z = this.z;

        return Math.sqrt(x*x + y*y + z*z);
    }

    /**
     * Compute the direction from this to v
     * @param v a vector
     * @returns a new unit vector pointing to v from this
     */
    directionTo(v: Vector3): Vector3
    {
        return v._clone()._subtract(this)._normalize();
    }

    /**
     * Check if this and v have the same coordinates
     * @param v a vector
     * @returns true if this and v have the same coordinates
     */
    equals(v: Vector3): boolean
    {
        return this.x === v.x && this.y === v.y && this.z === v.z;
    }

    /**
     * Convert to string
     * @returns a string
     */
    toString(): string
    {
        const x = this.x.toFixed(5);
        const y = this.y.toFixed(5);
        const z = this.z.toFixed(5);

        return `Vector3(${x},${y},${z})`;
    }

    /**
     * Clone this vector
     * @returns a clone of this vector
     * @internal
     */
    _clone(): Vector3
    {
        return new Vector3(this.x, this.y, this.z);
    }

    /**
     * Set the coordinates of this vector
     * @param x x-coordinate
     * @param y y-coordinate
     * @param z z-coordinate
     * @returns this vector
     * @internal
     */
    _set(x: number, y: number, z: number): Vector3
    {
        this.x = +x;
        this.y = +y;
        this.z = +z;

        return this;
    }

    /**
     * Copy v to this
     * @param v a vector
     * @returns this vector
     * @internal
     */
    _copyFrom(v: Vector3): Vector3
    {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;

        return this;
    }

    /**
     * Normalize this vector
     * @returns this vector, normalized
     * @internal
     */
    _normalize(): Vector3
    {
        const length = this.length();

        if(length < EPSILON) // zero?
            return this;

        this.x /= length;
        this.y /= length;
        this.z /= length;

        return this;
    }

    /**
     * Add v to this vector
     * @param v a vector
     * @returns this vector
     * @internal
     */
    _add(v: Vector3): Vector3
    {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;

        return this;
    }

    /**
     * Subtract v from this vector
     * @param v a vector
     * @returns this vector
     * @internal
     */
    _subtract(v: Vector3): Vector3
    {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;

        return this;
    }

    /**
     * Scale this vector by a scalar
     * @param s scalar
     * @returns this vector
     * @internal
     */
    _scale(s: number): Vector3
    {
        this.x *= s;
        this.y *= s;
        this.z *= s;

        return this;
    }
}
