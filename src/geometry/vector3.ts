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

import { Nullable } from '../utils/utils';
import { Quaternion } from './quaternion';

/** Small number */
const EPSILON = 1e-6;

/** Immutable zero vector */
let ZERO: Nullable<Vector3> = null;

// public / non-internal methods do not change the contents of the vector



/**
 * A vector in 3D space
 */
export class Vector3
{
    /** x coordinate */
    private _x: number;

    /** y coordinate */
    private _y: number;

    /** z coordinate */
    private _z: number;



    /**
     * Constructor
     */
    constructor(x: number = 0, y: number = 0, z: number = 0)
    {
        this._x = +x;
        this._y = +y;
        this._z = +z;
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
     * Immutable zero vector
     * @returns an immutable zero vector
     */
    static get ZERO(): Vector3
    {
        return ZERO || (ZERO = Object.freeze(Vector3.Zero()) as Vector3);
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
     * The z coordinate of the vector
     */
    get z(): number
    {
        return this._z;
    }

    /**
     * The length of this vector
     * @returns sqrt(x^2 + y^2 + z^2)
     */
    length(): number
    {
        const x = this._x;
        const y = this._y;
        const z = this._z;

        return Math.sqrt(x*x + y*y + z*z);
    }

    /**
     * Compute the dot product of this and v
     * @param v a vector
     * @returns the dot product of the vectors
     */
    dot(v: Vector3): number
    {
        return this._x * v._x + this._y * v._y + this._z * v._z;
    }

    /**
     * Compute the distance between points this and v
     * @param v a vector / point
     * @returns the distance between the points
     */
    distanceTo(v: Vector3): number
    {
        const dx = this._x - v._x;
        const dy = this._y - v._y;
        const dz = this._z - v._z;

        return Math.sqrt(dx*dx + dy*dy + dz*dz);
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
     * The cross product of this and v
     * @param v a vector
     * @returns the cross product this x v
     */
    cross(v: Vector3): Vector3
    {
        const x = this._y * v._z - this._z * v._y;
        const y = this._z * v._x - this._x * v._z;
        const z = this._x * v._y - this._y * v._x;

        return new Vector3(x, y, z);
    }

    /**
     * Check if this and v have the same coordinates
     * @param v a vector
     * @returns true if this and v have the same coordinates
     */
    equals(v: Vector3): boolean
    {
        return this._x === v._x && this._y === v._y && this._z === v._z;
    }

    /**
     * Convert to string
     * @returns a string
     */
    toString(): string
    {
        const x = this._x.toFixed(5);
        const y = this._y.toFixed(5);
        const z = this._z.toFixed(5);

        return `Vector3(${x},${y},${z})`;
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
        this._x = +x;
        this._y = +y;
        this._z = +z;

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
        this._x = v._x;
        this._y = v._y;
        this._z = v._z;

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

        this._x /= length;
        this._y /= length;
        this._z /= length;

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
        this._x += v._x;
        this._y += v._y;
        this._z += v._z;

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
        this._x -= v._x;
        this._y -= v._y;
        this._z -= v._z;

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
        this._x *= s;
        this._y *= s;
        this._z *= s;

        return this;
    }

    /**
     * Compute the rotation q p q* in place, where q is a unit quaternion,
     * q* is its conjugate and multiplicative inverse, and p is this vector
     * @param q unit quaternion
     * @returns this vector
     * @internal
     */
    _applyRotationQuaternion(q: Quaternion): Vector3
    {
        // based on Quaternion._toRotationMatrix()
        const x = q.x, y = q.y, z = q.z, w = q.w;
        const vx = this._x, vy = this._y, vz = this._z;

        const x2 = x*x, y2 = y*y, z2 = z*z;
        const xy = 2*x*y, xz = 2*x*z, yz = 2*y*z;
        const wx = 2*w*x, wy = 2*w*y, wz = 2*w*z;

        this._x = (1-2*(y2+z2)) * vx + (xy-wz) * vy + (xz+wy) * vz;
        this._y = (xy+wz) * vx + (1-2*(x2+z2)) * vy + (yz-wx) * vz;
        this._z = (xz-wy) * vx + (yz+wx) * vy + (1-2*(x2+y2)) * vz;

        return this;
    }

    /**
     * Clone this vector
     * @returns a clone of this vector
     * @internal
     */
    _clone(): Vector3
    {
        return new Vector3(this._x, this._y, this._z);
    }
}
