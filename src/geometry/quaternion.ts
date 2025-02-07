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
 * quaternion.ts
 * Quaternions
 */

import Speedy from 'speedy-vision';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { IllegalArgumentError } from '../utils/errors';
import { Vector3 } from './vector3';

/** Small number */
const EPSILON = 1e-6;

// public / non-internal methods do not change the contents of the quaternion



/**
 * Quaternion q = x i + y j + z k + w
 */
export class Quaternion
{
    /** x coordinate (imaginary) */
    private _x: number;

    /** y coordinate (imaginary) */
    private _y: number;

    /** z coordinate (imaginary) */
    private _z: number;

    /** w coordinate (real) */
    private _w: number;



    /**
     * Constructor
     * @param x x coordinate (imaginary)
     * @param y y coordinate (imaginary)
     * @param z z coordinate (imaginary)
     * @param w w coordinate (real)
     */
    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1)
    {
        this._x = +x;
        this._y = +y;
        this._z = +z;
        this._w = +w;
    }

    /**
     * Instantiate an identity quaternion q = 1
     * @returns a new identity quaternion
     */
    static Identity(): Quaternion
    {
        return new Quaternion(0, 0, 0, 1);
    }

    /**
     * Create a unit quaternion from an axis-angle representation of a rotation
     * @param axis non-zero
     * @param angle in radians
     * @returns a new quaternion
     */
    static FromAxisAngle(axis: Vector3, angle: number): Quaternion
    {
        // sanity check
        if(axis.dot(axis) < EPSILON * EPSILON)
            return Quaternion.Identity();

        // create the quaternion
        const sin = Math.sin(angle / 2);
        const cos = Math.cos(angle / 2);
        const r = axis.normalized();

        const x = r.x * sin;
        const y = r.y * sin;
        const z = r.z * sin;
        const w = cos;

        return new Quaternion(x, y, z, w);
    }

    /**
     * The x coordinate of the quaternion (imaginary)
     */
    get x(): number
    {
        return this._x;
    }

    /**
     * The y coordinate of the quaternion (imaginary)
     */
    get y(): number
    {
        return this._y;
    }

    /**
     * The z coordinate of the quaternion (imaginary)
     */
    get z(): number
    {
        return this._z;
    }

    /**
     * The w coordinate of the quaternion (real)
     */
    get w(): number
    {
        return this._w;
    }

    /**
     * The length of this quaternion
     * @returns sqrt(x^2 + y^2 + z^2 + w^2)
     */
    length(): number
    {
        const x = this._x;
        const y = this._y;
        const z = this._z;
        const w = this._w;

        return Math.sqrt(x*x + y*y + z*z + w*w);
    }

    /**
     * Check if this and q have the same coordinates
     * @param q a quaternion
     * @returns true if this and q have the same coordinates
     */
    equals(q: Quaternion): boolean
    {
        return this._w === q._w && this._x === q._x && this._y === q._y && this._z === q._z;
    }

    /**
     * Convert to string
     * @returns a string
     */
    toString(): string
    {
        const x = this._x.toFixed(4);
        const y = this._y.toFixed(4);
        const z = this._z.toFixed(4);
        const w = this._w.toFixed(4);

        return `Quaternion(${x},${y},${z},${w})`;
    }

    /**
     * Normalize this quaternion
     * @returns this quaternion, normalized
     * @internal
     */
    _normalize(): Quaternion
    {
        const length = this.length();

        if(length < EPSILON) // zero?
            return this;

        this._x /= length;
        this._y /= length;
        this._z /= length;
        this._w /= length;

        return this;
    }

    /**
     * Conjugate this quaternion
     * @returns this quaternion, conjugated
     * @internal
     */
    _conjugate(): Quaternion
    {
        this._x = -this._x;
        this._y = -this._y;
        this._z = -this._z;

        return this;
    }

    /**
     * Set the coordinates of this quaternion
     * @param x x-coordinate
     * @param y y-coordinate
     * @param z z-coordinate
     * @param w w-coordinate
     * @returns this quaternion
     * @internal
     */
    _set(x: number, y: number, z: number, w: number): Quaternion
    {
        this._x = +x;
        this._y = +y;
        this._z = +z;
        this._w = +w;

        return this;
    }

    /**
     * Copy q to this
     * @param q a quaternion
     * @returns this quaternion
     * @internal
     */
    _copyFrom(q: Quaternion): Quaternion
    {
        this._x = q._x;
        this._y = q._y;
        this._z = q._z;
        this._w = q._w;

        return this;
    }

    /**
     * Convert a quaternion to a 3x3 rotation matrix
     * @returns a 3x3 rotation matrix
     * @internal
     */
    _toRotationMatrix(): SpeedyMatrix
    {
        const length = this.length(); // should be ~ 1

        // sanity check
        if(length < EPSILON)
            return Speedy.Matrix.Eye(3);

        // let q = (x,y,z,w) be a unit quaternion
        const x = this._x / length;
        const y = this._y / length;
        const z = this._z / length;
        const w = this._w / length;

        /*

        Let q = x i + y j + z k + w be a unit quaternion and
        p = x_p i + y_p j + z_p k be a purely imaginary quaternion (w_p = 0)
        representing a vector or point P = (x_p, y_p, z_p) in 3D space.

        Let's rewrite q as q = v + w, where v = x i + y j + z k, and then
        substitute v by the unit vector u = v / |v|, so that q = |v| u + w.
        Since q is a unit quaternion, it follows that:

        1 = |q|^2 = x^2 + y^2 + z^2 + w^2 = |v|^2 + w^2.

        Given that cos(t~)^2 + sin(t~)^2 = 1 for all real t~, there is a real t
        such that cos(t) = w and sin(t) = |v|. Let's rewrite q as:

        q = cos(t) + u sin(t)

        (since 0 <= |v| = sin(t), it follows that 0 <= t <= pi)

        A rotation of P, of 2t radians around axis u, can be computed as:

        r_q(p) = q p q*

        where q* is the conjugate of q. (note: since |q| = 1, q q* = q* q = 1)

        ---

        Let h = x_h i + y_h j + z_h k + w_h be a quaternion. The multplication
        q h can be performed by pre-multiplying h, written as a column vector,
        by the following L_q matrix:

                      [  w  -z   y   x  ] [ x_h ]
        q h = L_q h = [  z   w  -x   y  ] [ y_h ]
                      [ -y   x   w   z  ] [ z_h ]
                      [ -x  -y  -z   w  ] [ w_h ]

        (expand q h = (x i + y j + z k + w) (x_h i + y_h j + z_h k + w_h) to see)

        Similarly, the product h q* can be expressed by pre-multiplying h by the
        following R_q* matrix:

                        [  w  -z   y  -x ] [ x_h ]
        h q* = R_q* h = [  z   w  -x  -y ] [ y_h ]
                        [ -y   x   w  -z ] [ z_h ]
                        [  x   y   z   w ] [ w_h ]

        (expand h q* = (x_h i + y_h j + z_h k + w_h) (-x i - y j - z k + w) to see)

        Note that matrices L_q and R_h* have orthogonal columns / rows and are
        antisymmetric. Additionally, L_q' = L_q* and R_q' = R_q* by symmetry.

        ---

        Although quaternion multiplication is not commutative, it is associative,
        i.e., r_q(p) = (q p)q* = q(p q*). From the matrix equations above, it
        follows that r_q(p) can be expressed as R_q* L_q p = L_q R_q* p. If we
        define M_q = L_q R_q* = R_q* L_q, we can write r_q(p) = M_q p. Matrix M_q
        has the following form:

              [ w^2 + x^2 - y^2 - z^2  2xy - 2wz              2xz + 2wy              0 ]
        M_q = [ 2xy + 2wz              w^2 - x^2 + y^2 - z^2  2yz - 2wx              0 ]
              [ 2xz - 2wy              2yz + 2wx              w^2 - x^2 - y^2 + z^2  0 ]
              [ 0                      0                      0                      1 ]

        Note: the bottom-right entry is x^2 + y^2 + z^2 + w^2 = |q|^2 = 1.

        Let M be the top-left 3x3 submatrix of M_q. A direct, but boring,
        computation shows that M'M = M M' = I, where M' is the transpose of M.
        In addition, det M = |q|^6 = +1. Therefore, M is a 3x3 rotation matrix.

        */

        const x2 = 2*x*x, y2 = 2*y*y, z2 = 2*z*z;
        const xy = 2*x*y, xz = 2*x*z, yz = 2*y*z;
        const wx = 2*w*x, wy = 2*w*y, wz = 2*w*z;

        return Speedy.Matrix(3, 3, [
            1-(y2+z2), xy+wz, xz-wy,
            xy-wz, 1-(x2+z2), yz+wx,
            xz+wy, yz-wx, 1-(x2+y2)
        ]);
    }

    /**
     * Convert a 3x3 rotation matrix to a unit quaternion
     * @param m a 3x3 rotation matrix. You should ensure that it is a rotation matrix
     * @returns this quaternion
     * @internal
     */
    _fromRotationMatrix(m: SpeedyMatrix): Quaternion
    {
        if(m.rows != 3 || m.columns != 3)
            throw new IllegalArgumentError();

        /*

        Let M be the rotation matrix defined above. We're going to find a
        unit quaternion q associated with M.

        Before we begin, note that q and (-q) encode the same rotation, for
        r_(-q)(p) = (-q)p(-q)* = (-1)q p (-1)q* = (-1)(-1)q p q* = q p q* = r_q(p).
        Quaternion multiplication is commutative when a factor is a scalar, i.e.,
        d p = p d for a real d and a quaternion p (check: distributive operation).

        The trace of M, denoted as tr M, is 3w^2 - x^2 - y^2 - z^2. Since |q| = 1,
        it follows that tr M = 3w^2 - (1 - w^2), which means that 4w^2 = 1 + tr M.
        That being the case, we can write:

        |w| = sqrt(1 + tr M) / 2

        We'll arbitrarily pick w >= 0, for q and (-q) encode the same rotation.

        Let mij denote the element at the i-th row and at the j-th column of M.
        A direct verification shows that m21 - m12 = 4wz. Since w >= 0, it follows
        that sign(z) = sign(m21 - m12). Similarly, sign(y) = sign(m13 - m31) and
        sign(x) = sign(m32 - m23).

        The quantity m11 + m22 is equal to 2w^2 - 2z^2, which means that 4z^2 =
        4w^2 - 2(m11 + m22) = (1 + tr M) - 2(m11 + m22). Therefore, let's write:

        |z| = sqrt((1 + tr M) - 2(m11 + m22)) / 2

        Of course, z = |z| sign(z). Similarly,

        |y| = sqrt((1 + tr M) - 2(m11 + m33)) / 2

        |x| = sqrt((1 + tr M) - 2(m22 + m33)) / 2

        This gives (x, y, z, w).

        ---

        We quickly verify that (1 + tr M) - 2(m11 + m22) >= 0 if M is (really)
        a rotation matrix: (1 + tr M) - 2(m11 + m22) = 1 + tr M - 2(tr M - m33) =
        1 - tr M + 2 m33 = 1 - (3w^2 - x^2 - y^2 - z^2) + 2(w^2 - x^2 - y^2 + z^2) =
        1 - w^2 + z^2 = (x^2 + y^2 + z^2 + w^2) - w^2 + z^2 = x^2 + y^2 + 2 z^2 >= 0.
        Similarly, (1 + tr M) - 2(m11 + m33) >= 0 and (1 + tr M) - 2(m22 + m33) >= 0.

        */

        const data = m.read();
        const m11 = data[0], m21 = data[1], m31 = data[2],
              m12 = data[3], m22 = data[4], m32 = data[5],
              m13 = data[6], m23 = data[7], m33 = data[8];

        const tr = 1 + m11 + m22 + m33; // 1 + tr M
        const sx = +(m32 >= m23) - +(m32 < m23); // sign(x)
        const sy = +(m13 >= m31) - +(m13 < m31); // sign(y)
        const sz = +(m21 >= m12) - +(m21 < m12); // sign(z)

        const w = 0.5 * Math.sqrt(Math.max(0, tr)); // |w| = w
        const x = 0.5 * Math.sqrt(Math.max(0, tr - 2 * (m22 + m33))); // |x|
        const y = 0.5 * Math.sqrt(Math.max(0, tr - 2 * (m11 + m33))); // |y|
        const z = 0.5 * Math.sqrt(Math.max(0, tr - 2 * (m11 + m22))); // |z|

        const length = Math.sqrt(x*x + y*y + z*z + w*w); // should be ~ 1
        this._x = (x * sx) / length;
        this._y = (y * sy) / length;
        this._z = (z * sz) / length;
        this._w = w / length;

        return this;
    }

    /**
     * Clone this quaternion
     * @returns a clone of this quaternion
     * @internal
     */
    _clone(): Quaternion
    {
        return new Quaternion(this._x, this._y, this._z, this._w);
    }
}
