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
 * view.ts
 * A viewer represents a virtual camera in 3D world space
 */

import Speedy from 'speedy-vision';
import { CameraModel } from './camera-model';
import { Pose } from './pose';
import { ViewerPose } from './viewer-pose';
import { View, PerspectiveView } from './view';
import { Transform } from './transform';
import { Vector2 } from './vector2';
import { Vector3 } from './vector3';
import { Ray } from './ray';



/**
 * A viewer represents a virtual camera in 3D world space
 */
export class Viewer
{
    /** the pose of the viewer in 3D world space */
    private readonly _pose: ViewerPose;

    /** the views of this viewer (1 for monoscopic rendering; 2 for stereoscopic) */
    private readonly _views: View[];




    /**
     * Constructor
     * @param camera camera model
     */
    constructor(camera: CameraModel)
    {
        this._pose = new ViewerPose(camera);
        this._views = [ new PerspectiveView(camera) ];
    }

    /**
     * The pose of this viewer
     */
    get pose(): ViewerPose
    {
        return this._pose;
    }

    /**
     * The view of this viewer (only for monoscopic rendering)
     */
    get view(): View
    {
        /*
        if(this._views.length > 1)
            throw new IllegalOperationError('Use viewer.views for stereoscopic rendering');
        */

        return this._views[0];
    }

    /**
     * The views of this viewer
     */
    /*
    get views(): View[]
    {
        return this._views.concat([]);
    }
    */

    /**
     * Convert a pose from world space to viewer space
     * @param pose a pose in world space
     * @returns a pose in viewer space
     */
    convertToViewerSpace(pose: Pose): Pose
    {
        const modelMatrix = pose.transform.matrix;
        const viewMatrix = this._pose.viewMatrix;
        const modelViewMatrix = Speedy.Matrix(viewMatrix.times(modelMatrix));

        const transform = new Transform(modelViewMatrix);
        return new Pose(transform);
    }

    /**
     * Cast a ray from a point in the image space associated with this Viewer
     * @param position a point in image space, given in normalized units [-1,1]x[-1,1]
     * @returns a ray in world space that corresponds to the given point
     */
    raycast(position: Vector2): Ray
    {
        const projectionMatrixInverse = this.view._projectionMatrixInverse;
        const viewMatrixInverse = this._pose.transform.matrix;
        const pointInClipSpace = Speedy.Matrix(4, 1, [
            // Normalized Device Coordinates (NDC)
            position.x,
            position.y,
            0, // (*)
            1  // homogeneous coordinates
        ]);

        const pointInViewSpace = projectionMatrixInverse.times(pointInClipSpace);
        const pointInWorldSpace = viewMatrixInverse.times(pointInViewSpace);
        const p = Speedy.Matrix(pointInWorldSpace).read();

        /*

        (*) since we're just interested in the direction, any z coordinate in
            clip space [-1,1] will give us a suitable point p in world space.

        */

        const origin = this._pose.transform.position;
        const direction = new Vector3(p[0] / p[3], p[1] / p[3], p[2] / p[3])
                          ._subtract(origin)._normalize();

        return new Ray(origin, direction);
    }
}