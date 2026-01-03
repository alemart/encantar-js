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
 * transform.ts
 * 3D transforms
 */

import Speedy from 'speedy-vision';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { Nullable } from '../utils/utils';
import { IllegalArgumentError, IllegalOperationError } from '../utils/errors';
import { Vector3 } from './vector3';
import { Quaternion } from './quaternion';

/** Small number */
const EPSILON = 1e-6;



/**
 * A Transform represents a position, a rotation and a scale in 3D space
 */
export class Transform
{
    /** transformation matrix */
    private readonly _matrix: SpeedyMatrix;

    /** inverse transform, computed lazily */
    private _inverse: Nullable<Transform>;

    /** position component, computed lazily */
    private _position: Vector3;

    /** orientation component, computed lazily */
    private _orientation: Quaternion;

    /** scale component, computed lazily */
    private _scale: Vector3;

    /** whether or not this transformation has been decomposed */
    private _isDecomposed: boolean;

    /** whether or not we have extracted the position from the matrix */
    private _isPositionComputed: boolean;

    /** unit right vector of the local space, computed lazily */
    private _right: Vector3;

    /** unit up vector of the local space, computed lazily */
    private _up: Vector3;

    /** unit forward vector of the local space, computed lazily */
    private _forward: Vector3;



    /**
     * Constructor
     * @param matrix a 4x4 transformation matrix. You should ensure that its form is T * R * S (translation * rotation * scale).
     */
    constructor(matrix: SpeedyMatrix)
    {
        if(matrix.rows != 4 || matrix.columns != 4)
            throw new IllegalArgumentError('A Transform expects a 4x4 transformation matrix');

        this._matrix = matrix;
        this._inverse = null;

        this._position = Vector3.Zero();
        this._orientation = Quaternion.Identity();
        this._scale = new Vector3(1, 1, 1);

        this._isDecomposed = false;
        this._isPositionComputed = false;

        this._right = Vector3.ZERO;
        this._up = Vector3.ZERO;
        this._forward = Vector3.ZERO;
    }

    /**
     * The 4x4 transformation matrix
     * This matrix is not meant to be changed. Changing it will not update the
     * previously computed components of the transform!
     */
    get matrix(): SpeedyMatrix
    {
        return this._matrix;
    }

    /**
     * The inverse transform
     */
    get inverse(): Transform
    {
        if(this._inverse === null)
            this._inverse = new Transform(this._inverseMatrix());

        return this._inverse;
    }

    /**
     * The 3D position encoded by the transform
     */
    get position(): Vector3
    {
        if(!this._isPositionComputed)
            this._computePosition();

        return this._position;
    }

    /**
     * A unit quaternion describing the rotational component of the transform
     */
    get orientation(): Quaternion
    {
        if(!this._isDecomposed)
            this._decompose();

        return this._orientation;
    }

    /**
     * The scale encoded by the transform
     */
    get scale(): Vector3
    {
        if(!this._isDecomposed)
            this._decompose();

        return this._scale;
    }

    /**
     * Unit right vector of the local space
     */
    get right(): Vector3
    {
        if(this._right === Vector3.ZERO)
            this._right = this._scaleAndRotate(new Vector3(1, 0, 0))._normalize();

        return this._right;
    }

    /**
     * Unit up vector of the local space
     */
    get up(): Vector3
    {
        if(this._up === Vector3.ZERO)
            this._up = this._scaleAndRotate(new Vector3(0, 1, 0))._normalize();

        return this._up;
    }

    /**
     * Unit forward vector of the local space
     */
    get forward(): Vector3
    {
        if(this._forward === Vector3.ZERO) {
            // in a right-handed system, the unit forward vector is (0, 0, -1)
            // in a left-handed system, it is (0, 0, 1)
            this._forward = this._scaleAndRotate(new Vector3(0, 0, -1))._normalize();
        }

        return this._forward;
    }

    /**
     * Use this transform to scale and rotate a vector
     * The translation component of the transform is ignored
     * @param v a vector
     * @returns input vector v
     */
    private _scaleAndRotate(v: Vector3): Vector3
    {
        const m = this._matrix.read();
        const h = Math.abs(m[15]) < EPSILON ? Number.NaN : 1 / m[15]; // usually h = 1
        const vx = v.x, vy = v.y, vz = v.z;

        const x = m[0] * vx + m[4] * vy + m[8] * vz;
        const y = m[1] * vx + m[5] * vy + m[9] * vz;
        const z = m[2] * vx + m[6] * vy + m[10] * vz;

        return v._set(x * h, y * h, z * h);
    }

    /**
     * Decompose this transform
     */
    private _decompose(): void
    {
        /*

        The shape of a 4x4 transform T * R * S is

        [  RS  t  ]
        [  0'  1  ]

        where S is a 3x3 diagonal matrix, R is a 3x3 rotation matrix, t is a
        3x1 translation vector and 0' is a 1x3 zero vector.

        How do we decompose it?

        1) Decomposing the translation vector t is trivial

        2) Decomposing matrices R (rotation) and S (scale) can be done by
           noticing that (RS)'(RS) = (S'R')(RS) = S'(R'R) S = S'S is diagonal

        3) Since R is a rotation matrix, we have det R = +1. This means that
           det RS = det R * det S = det S. If det RS < 0, then we have a change
           of handedness (i.e., a negative scale). We may flip the forward axis
           (Z) and let the rotation matrix encode the rest of the transformation

        4) Use 2) and 3) to find a suitable S

        5) Compute R = (RS) * S^(-1)

        */
        const m = this._matrix.read();
        const h = Math.abs(m[15]) < EPSILON ? Number.NaN : 1 / m[15]; // usually h = 1

        // find t
        const tx = m[12] * h;
        const ty = m[13] * h;
        const tz = m[14] * h;

        // find RS
        const rs11 = m[0] * h;
        const rs21 = m[1] * h;
        const rs31 = m[2] * h;
        const rs12 = m[4] * h;
        const rs22 = m[5] * h;
        const rs32 = m[6] * h;
        const rs13 = m[8] * h;
        const rs23 = m[9] * h;
        const rs33 = m[10] * h;

        // do we have a change of handedness?
        const det = rs13 * (rs21 * rs32 - rs22 * rs31) + rs33 * (rs11 * rs22 - rs12 * rs21) - rs23 * (rs11 * rs32 - rs12 * rs31);
        const sign = +(det >= 0) - +(det < 0);

        // if det = 0, RS is not invertible!

        // find S
        const sx = Math.sqrt(rs11 * rs11 + rs12 * rs12 + rs13 * rs13);
        const sy = Math.sqrt(rs21 * rs21 + rs22 * rs22 + rs23 * rs23);
        const sz = Math.sqrt(rs31 * rs31 + rs32 * rs32 + rs33 * rs33) * sign;

        // zero scale?
        if(sx < EPSILON || sy < EPSILON || sz * sign < EPSILON) {
            this._position._set(tx, ty, tz);
            this._scale._set(sx, sy, sz);
            this._orientation._copyFrom(Quaternion.Identity());
            this._isDecomposed = true;
            this._isPositionComputed = true;
            return;
        }

        // find S^(-1)
        const zx = 1 / sx;
        const zy = 1 / sy;
        const zz = 1 / sz;

        // find R
        const r11 = rs11 * zx;
        const r21 = rs21 * zx;
        const r31 = rs31 * zx;
        const r12 = rs12 * zy;
        const r22 = rs22 * zy;
        const r32 = rs32 * zy;
        const r13 = rs13 * zz;
        const r23 = rs23 * zz;
        const r33 = rs33 * zz;

        // set the components
        this._position._set(tx, ty, tz);
        this._scale._set(sx, sy, sz);
        this._orientation._fromRotationMatrix(Speedy.Matrix(3, 3, [
            r11, r21, r31,
            r12, r22, r32,
            r13, r23, r33
        ]));

        // done!
        this._isDecomposed = true;
        this._isPositionComputed = true;
    }

    /**
     * A simpler decomposition routine.
     * Sometimes we just need the position.
     */
    private _computePosition(): void
    {
        const m = this._matrix.read();
        const h = Math.abs(m[15]) < EPSILON ? Number.NaN : 1 / m[15]; // usually h = 1

        // find t
        this._position._set(m[12] * h, m[13] * h, m[14] * h);

        // done!
        this._isPositionComputed = true;
    }

    /**
     * Compute the inverse matrix of this transform
     * @returns the inverse matrix
     */
    private _inverseMatrix(): SpeedyMatrix
    {
        // test
        //console.log(Speedy.Matrix(this._matrix.inverse().times(this._matrix)).toString());

        // this works, but this inverse is straightforward
        return Speedy.Matrix(this._matrix.inverse());

        /*

        Simple analytic method
        ----------------------

        The inverse of a 4x4 transform T * R * S

        [  RS  t  ]    is    [  ZR' -ZR't ]
        [  0'  1  ]          [  0'    1   ]

        where S is 3x3, R is 3x3, t is 3x1, 0' is 1x3 and Z is the inverse of S

        R is a rotation matrix; S is a diagonal matrix

        */

        /*
        // decompose the transform
        if(!this._isDecomposed)
            this._decompose();

        // find t
        const tx = this._position.x;
        const ty = this._position.y;
        const tz = this._position.z;

        // find S (typically 1, but not very accurate)
        const sx = this._scale.x;
        const sy = this._scale.y;
        const sz = this._scale.z;

        // sanity check
        if(Math.abs(sx) < EPSILON || Math.abs(sy) < EPSILON || Math.abs(sz) < EPSILON) {
            //throw new IllegalOperationError('Not an invertible transform: ' + this._matrix.toString());
            return Speedy.Matrix(4, 4, new Array(16).fill(Number.NaN)); // more friendly behavior
        }

        // find R
        const r = this._rotation.read();
        const r11 = r[0];
        const r21 = r[1];
        const r31 = r[2];
        const r12 = r[3];
        const r22 = r[4];
        const r32 = r[5];
        const r13 = r[6];
        const r23 = r[7];
        const r33 = r[8];

        // find Z = S^(-1)
        const zx = 1 / sx;
        const zy = 1 / sy;
        const zz = 1 / sz;

        // compute Z R'
        const zr11 = zx * r11;
        const zr21 = zy * r12;
        const zr31 = zz * r13;
        const zr12 = zx * r21;
        const zr22 = zy * r22;
        const zr32 = zz * r23;
        const zr13 = zx * r31;
        const zr23 = zy * r32;
        const zr33 = zz * r33;

        // compute -Z R't
        const zrt1 = -(tx * zr11 + ty * zr12 + tz * zr13);
        const zrt2 = -(tx * zr21 + ty * zr22 + tz * zr23);
        const zrt3 = -(tx * zr31 + ty * zr32 + tz * zr33);

        // test
        console.log('inverse', Speedy.Matrix(Speedy.Matrix(4, 4, [
            zr11, zr21, zr31, 0,
            zr12, zr22, zr32, 0,
            zr13, zr23, zr33, 0,
            zrt1, zrt2, zrt3, 1
        ]).times(this._matrix)).toString());

        console.log('rotation', Speedy.Matrix(
            this._rotation.transpose().times(this._rotation)
        ).toString());

        console.log('scale', this._scale);

        // done!
        return Speedy.Matrix(4, 4, [
            zr11, zr21, zr31, 0,
            zr12, zr22, zr32, 0,
            zr13, zr23, zr33, 0,
            zrt1, zrt2, zrt3, 1
        ]);
        */
    }
}
