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
 * view.ts
 * A view of the 3D world at a moment in time,
 * featuring the means to project points into clip space
 */

import Speedy from 'speedy-vision';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { CameraModel } from './camera-model';
import { IllegalArgumentError } from '../utils/errors';
import { Nullable } from '../utils/utils';

/** Default distance of the near plane to the optical center of the camera */
const DEFAULT_NEAR = 0.1;

/** Default distance of the far plane to the optical center of the camera */
const DEFAULT_FAR = 10000 * DEFAULT_NEAR;


/**
 * A view of the 3D world at a moment in time,
 * featuring the means to project points into clip space
 */
export interface View
{
    /** A 4x4 matrix that projects the viewer space into the clip space, i.e., [-1,1]^3 */
    readonly projectionMatrix: SpeedyMatrix;

    /** @internal The inverse of the projection matrix */
    readonly _projectionMatrixInverse: SpeedyMatrix;
}


/**
 * A PerspectiveView is a View defining a symmetric frustum around the z-axis
 * (perspective projection)
 */
export class PerspectiveView implements View
{
    /** Camera model */
    private readonly _camera: CameraModel;

    /** Distance of the near plane to the optical center of the camera */
    private readonly _near: number;

    /** Distance of the far plane to the optical center of the camera*/
    private readonly _far: number;

    /** A 4x4 matrix that projects viewer space into clip space, i.e., [-1,1]^3 */
    private readonly _projectionMatrix: SpeedyMatrix;

    /** The inverse of the projection matrix, computed lazily */
    private _inverseProjection: Nullable<SpeedyMatrix>;



    /**
     * Constructor
     * @param camera camera model
     * @param near distance of the near plane
     * @param far distance of the far plane
     */
    constructor(camera: CameraModel, near: number = DEFAULT_NEAR, far: number = DEFAULT_FAR)
    {
        this._near = +near;
        this._far = +far;

        if(this._near >= this._far)
            throw new IllegalArgumentError(`View expects near < far (found near = ${this._near} and far = ${this._far})`);
        else if(this._near <= 0)
            throw new IllegalArgumentError(`View expects a positive near (found ${this._near})`);

        this._camera = camera;
        this._projectionMatrix = camera.computeProjectionMatrix(this._near, this._far);
        this._inverseProjection = null;
    }

    /**
     * A 4x4 projection matrix for WebGL
     */
    get projectionMatrix(): SpeedyMatrix
    {
        return this._projectionMatrix;
    }

    /**
     * The inverse of the projection matrix
     * @internal
     */
    get _projectionMatrixInverse(): SpeedyMatrix
    {
        if(this._inverseProjection === null)
            this._inverseProjection = Speedy.Matrix(this._projectionMatrix.inverse());

        return this._inverseProjection;
    }

    /**
     * Aspect ratio of the frustum
     */
    get aspect(): number
    {
        return this._camera.aspectRatio;
    }

    /**
     * Horizontal field-of-view of the frustum, measured in radians
     */
    get fovx(): number
    {
        return this._camera.fovx;
    }

    /**
     * Vertical field-of-view of the frustum, measured in radians
     */
    get fovy(): number
    {
        return this._camera.fovy;
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
}