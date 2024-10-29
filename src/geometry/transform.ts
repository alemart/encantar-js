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
 * transform.ts
 * 3D transforms
 */

import Speedy from 'speedy-vision';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { Nullable } from '../utils/utils';
import { IllegalArgumentError } from '../utils/errors';


/**
 * A Transform represents a position, a rotation and a scale in 3D space
 */
export class Transform
{
    /** transformation matrix */
    private readonly _matrix: SpeedyMatrix;

    /** inverse transform, computed lazily */
    private _inverse: Nullable<Transform>;



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
    }

    /**
     * The 4x4 transformation matrix
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
            this._inverse = new Transform(Transform._invert(this._matrix));

        return this._inverse;
    }

    /**
     * Compute the inverse of a transformation matrix
     * @param matrix the transformation matrix to invert
     * @returns the inverse matrix
     */
    private static _invert(matrix: SpeedyMatrix): SpeedyMatrix
    {
        /*

        The inverse of a 4x4 transform T * R * S

        [  RS  t  ]    is    [  ZR' -ZR't ]
        [  0'  1  ]          [  0'    1   ]

        where S is 3x3, R is 3x3, t is 3x1, 0' is 1x3 and Z is the inverse of S

        R is a rotation matrix; S is a diagonal matrix

        */

        // this works, but this inverse is straightforward
        return Speedy.Matrix(matrix.inverse());
    }
}
