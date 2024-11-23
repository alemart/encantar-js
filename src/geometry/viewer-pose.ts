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
 * viewer-pose.ts
 * The pose of a virtual camera in 3D world space at a moment in time
 */

import Speedy from 'speedy-vision';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { Pose } from './pose';
import { Transform } from './transform';
import { CameraModel } from './camera-model';



/**
 * The pose of a virtual camera in 3D world space at a moment in time
 */
export class ViewerPose extends Pose
{
    /** The view matrix */
    private readonly _viewMatrix: SpeedyMatrix;



    /**
     * Constructor
     * @param camera camera model
     */
    constructor(camera: CameraModel)
    {
        const viewMatrix = camera.computeViewMatrix();
        const modelMatrix = Speedy.Matrix(viewMatrix.inverse());

        const transform = new Transform(modelMatrix);
        super(transform);

        this._viewMatrix = viewMatrix;
    }

    /**
     * This 4x4 matrix moves 3D points from world space to view space.
     * We assume that the camera is looking in the direction of the
     * negative z-axis (WebGL-friendly)
     */
    get viewMatrix(): SpeedyMatrix
    {
        return this._viewMatrix;
    }
}