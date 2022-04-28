/*
 * MARTINS.js Free Edition
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022  Alexandre Martins <alemartf(at)gmail.com>
 * https://github.com/alemart/martins-js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * transform.ts
 * 3D geometrical transforms
 */

import Speedy from 'speedy-vision';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { IllegalArgumentError, IllegalOperationError } from '../utils/errors';

/**
 * A 3D transformation
 */
abstract class BaseTransform
{
    /** 4x4 matrix describing the transformation */
    protected readonly _matrix: SpeedyMatrix;



    /**
     * Constructor
     * @param matrix a 4x4 matrix
     */
    constructor(matrix: SpeedyMatrix)
    {
        if(matrix.rows != 4 || matrix.columns != 4)
            throw new IllegalArgumentError('A 3D transform expects a 4x4 matrix');

        this._matrix = matrix;
    }

    /**
     * The 4x4 transformation matrix (read-only)
     */
    get matrix(): SpeedyMatrix
    {
        return this._matrix;
    }
}

/**
 * An invertible 3D transformation
 */
class InvertibleTransform extends BaseTransform
{
    /**
     * Constructor
     * @param matrix a 4x4 matrix
     */
    constructor(matrix: SpeedyMatrix)
    {
        // WARNING: we do not check if the matrix actually encodes an invertible transform!
        super(matrix);
    }

    /**
     * The inverse of the transform
     */
    get inverse(): InvertibleTransform
    {
        const inverseMatrix = Speedy.Matrix(this._matrix.inverse());
        return new InvertibleTransform(inverseMatrix);
    }
}

/**
 * A 3D transformation described by translation, rotation and scale
 */
export class StandardTransform extends InvertibleTransform
{
    // TODO: position, rotation and scale attributes

    /**
     * Constructor
     * @param matrix a 4x4 matrix
     */
    constructor(matrix: SpeedyMatrix)
    {
        // WARNING: we do not check if the matrix actually encodes a standard transform!
        super(matrix);
    }

    /**
     * The inverse of the transform
     */
    get inverse(): StandardTransform
    {
        /*

        The inverse of a 4x4 standard transform T * R * S...

        [  RS  t  ]    is    [  ZR' -ZR't ]
        [  0'  1  ]          [  0'    1   ]

        where S is 3x3, R is 3x3, t is 3x1, 0' is 1x3 and Z is the inverse of S

        */

        return super.inverse as StandardTransform;
    }
}

/**
 * A 3D transformation described by position and orientation
 */
export class RigidTransform extends StandardTransform
{
    // TODO: position and rotation attributes (need to decompose the matrix)

    /**
     * Constructor
     * @param matrix a 4x4 matrix
     */
    constructor(matrix: SpeedyMatrix)
    {
        // WARNING: we do not check if the matrix actually encodes a rigid transform!
        super(matrix);
    }

    /**
     * The inverse of the transform
     */
    get inverse(): RigidTransform
    {
        /*

        The inverse of a 4x4 rigid transform

        [  R   t  ]    is    [  R'  -R't  ]
        [  0'  1  ]          [  0'    1   ]

        where R is 3x3, t is 3x1 and 0' is 1x3

        */

        const m = this._matrix.read();
        if(m[15] == 0) // error? abs()??
            throw new IllegalOperationError('Not a rigid transform');
        const s = 1 / m[15]; // should be 1 (normalize homogeneous coordinates)

        const r11 = m[0] * s, r12 = m[4] * s, r13 = m[8] * s;
        const r21 = m[1] * s, r22 = m[5] * s, r23 = m[9] * s;
        const r31 = m[2] * s, r32 = m[6] * s, r33 = m[10] * s;
        const t1 = m[12] * s, t2 = m[13] * s, t3 = m[14] * s;

        const rt1 = r11 * t1 + r21 * t2 + r31 * t3;
        const rt2 = r12 * t1 + r22 * t2 + r32 * t3;
        const rt3 = r13 * t1 + r23 * t2 + r33 * t3;

        const inverseMatrix = Speedy.Matrix(4, 4, [
            r11, r12, r13, 0,
            r21, r22, r23, 0,
            r31, r32, r33, 0,
            -rt1, -rt2, -rt3, 1
        ]);

        return new RigidTransform(inverseMatrix);
    }
}