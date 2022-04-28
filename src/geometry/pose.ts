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
 * pose.ts
 * A pose represents a position and an orientation in a 3D space
 */

import Speedy from 'speedy-vision';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { RigidTransform, StandardTransform } from './transform';



/**
 * A pose represents a position and an orientation in a 3D space
 * (and sometimes a scale, too...)
 */
export class Pose
{
    /** A transform in 3D world space */
    private _transform: StandardTransform;



    /**
     * Constructor
     * @param transform usually a rigid transform in a 3D space (e.g., world space, viewer space or other)
     */
    constructor(transform: StandardTransform)
    {
        this._transform = transform;
    }

    /**
     * A transform describing the position and the orientation
     * of the pose relative to the 3D space to which it belongs
     */
    get transform(): StandardTransform
    {
        return this._transform;
    }
}