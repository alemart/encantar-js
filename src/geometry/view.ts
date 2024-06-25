/*
 * MARTINS.js
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
 * view.ts
 * A view of the 3D world at a moment in time,
 * featuring the means to project points into clip space
 */

import Speedy from 'speedy-vision';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { CameraModel, FX, FY, U0, V0 } from './camera-model';
import { IllegalArgumentError } from '../utils/errors';

/** Default distance in pixels of the near plane to the optical center of the camera */
const DEFAULT_NEAR = 1;

/** Default distance in pixels of the far plane to the optical center of the camera */
const DEFAULT_FAR = 20000;



/**
 * A view of the 3D world at a moment in time,
 * featuring the means to project points into clip space
 */
export interface View
{
    /** A 4x4 matrix that projects the viewer space into the clip space, i.e., [-1,1]^3 */
    readonly projectionMatrix: SpeedyMatrix;
}

/**
 * A PerspectiveView is a View defining a symmetric frustum around the z-axis
 * (perspective projection)
 */
export class PerspectiveView implements View
{
    /** A 4x4 matrix that projects the viewer space into the clip space, i.e., [-1,1]^3 */
    private readonly _projectionMatrix: SpeedyMatrix;

    /** Tangent of the half of the vertical field-of-view */
    private readonly _tanOfHalfFovy: number;

    /** Aspect ratio of the frustum */
    private readonly _aspect: number;

    /** Distance of the near plane to the Z = 0 plane in viewer space */
    private readonly _near: number;

    /** Distance of the far plane to the Z = 0 plane in viewer space */
    private readonly _far: number;




    /**
     * Constructor
     * @param camera camera model
     * @param near distance of the near plane
     * @param far distance of the far plane
     */
    constructor(camera: CameraModel, near: number = DEFAULT_NEAR, far: number = DEFAULT_FAR)
    {
        const intrinsics = camera.intrinsics;
        const screenSize = camera.screenSize;

        this._near = Math.max(0, +near);
        this._far = Math.max(0, +far);

        if(this._near >= this._far)
            throw new IllegalArgumentError(`View expects near < far (found near = ${this._near} and far = ${this._far})`);

        this._aspect = screenSize.width / screenSize.height;
        this._tanOfHalfFovy = intrinsics[V0] / intrinsics[FY];
        this._projectionMatrix = PerspectiveView._computeProjectionMatrix(intrinsics, this._near, this._far);
    }

    /**
     * A 4x4 projection matrix for WebGL
     */
    get projectionMatrix(): SpeedyMatrix
    {
        return this._projectionMatrix;
    }

    /**
     * Aspect ratio of the frustum
     */
    get aspect(): number
    {
        return this._aspect;
    }

    /**
     * Vertical field-of-view of the frustum, measured in radians
     */
    get fovy(): number
    {
        return 2 * Math.atan(this._tanOfHalfFovy);
    }

    /**
     * Distance of the near plane
     */
    get near(): number
    {
        return this._near;
    }

    /**
     * Distance of the far plane
     */
    get far(): number
    {
        return this._far;
    }

    /**
     * Compute a perspective projection matrix for WebGL
     * @param K camera intrinsics
     * @param near distance of the near plane
     * @param far distance of the far plane
     */
    private static _computeProjectionMatrix(K: number[], near: number, far: number): SpeedyMatrix
    {
        // we assume that the principal point is at the center of the image
        const top = near * (K[V0] / K[FY]);
        const right = near * (K[U0] / K[FX]);
        const bottom = -top, left = -right; // symmetric frustum

        // a derivation of this projection matrix can be found at
        // https://www.songho.ca/opengl/gl_projectionmatrix.html
        // http://learnwebgl.brown37.net/08_projections/projections_perspective.html
        return Speedy.Matrix(4, 4, [
            2 * near / (right - left), 0, 0, 0,
            0, 2 * near / (top - bottom), 0, 0,
            (right + left) / (right - left), (top + bottom) / (top - bottom), -(far + near) / (far - near), -1,
            0, 0, -2 * far * near / (far - near), 0
        ]);
    }
}