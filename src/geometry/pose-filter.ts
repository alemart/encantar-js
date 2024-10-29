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
 * pose-filter.ts
 * Smoothing filter for a pose
 */

import Speedy from 'speedy-vision';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { Settings } from '../core/settings';
import { Quaternion } from './quaternion';
import { Vector3 } from './vector3';
import { IllegalArgumentError } from '../utils/errors';

/** Number of translation samples */
const TRANSLATION_SAMPLES = 5;

/** Number of rotation samples */
const ROTATION_SAMPLES = 12;

/** A vector representing "no translation" */
const NO_TRANSLATION = Vector3.Zero();

/** A quaternion representing "no rotation" */
const NO_ROTATION = Quaternion.Identity();

/** The zero quaternion */
const ZERO_QUATERNION = new Quaternion(0, 0, 0, 0);





/**
 * Smoothing filter for a pose
 */
export class PoseFilter
{
    /** smooth rotation */
    private _smoothRotation: Quaternion;

    /** smooth translation */
    private _smoothTranslation: Vector3;

    /** samples of rotations */
    private _rotationSample: Quaternion[];

    /** samples of translations */
    private _translationSample: Vector3[];

    /** empty buffers? (i.e., no samples collected?) */
    private _isEmpty: boolean;



    /**
     * Constructor
     */
    constructor()
    {
        this._smoothRotation = Quaternion.Identity();
        this._smoothTranslation = Vector3.Zero();
        this._rotationSample = Array.from({ length: ROTATION_SAMPLES }, () => Quaternion.Identity());
        this._translationSample = Array.from({ length: TRANSLATION_SAMPLES }, () => Vector3.Zero());
        this._isEmpty = true;
    }

    /**
     * Reset the filter
     */
    reset(): void
    {
        this._rotationSample.forEach(q => q._copyFrom(NO_ROTATION));
        this._translationSample.forEach(t => t._copyFrom(NO_TRANSLATION));
        this._isEmpty = true;
    }

    /**
     * Feed the filter with a sample
     * @param sample 3x4 [ R | t ] matrix
     * @returns true on success
     */
    feed(sample: SpeedyMatrix): boolean
    {
        const data = sample.read();

        // sanity check
        if(sample.rows != 3 || sample.columns != 4)
            throw new IllegalArgumentError();

        // discard invalid samples
        if(Number.isNaN(data[0] * data[9])) // rotation, translation
            return false;

        // store sample
        const q = this._rotationSample[ROTATION_SAMPLES - 1];
        for(let i = ROTATION_SAMPLES - 1; i > 0; i--)
            this._rotationSample[i] = this._rotationSample[i-1];
        this._rotationSample[0] = q._fromRotationMatrix(sample.block(0, 2, 0, 2));

        const t = this._translationSample[TRANSLATION_SAMPLES - 1];
        for(let i = TRANSLATION_SAMPLES - 1; i > 0; i--)
            this._translationSample[i] = this._translationSample[i-1];
        this._translationSample[0] = t._set(data[9], data[10], data[11]);

        // empty buffers?
        if(this._isEmpty) {
            this._rotationSample.forEach((q, i) => i > 0 && q._copyFrom(this._rotationSample[0]));
            this._translationSample.forEach((t, i) => i > 0 && t._copyFrom(this._translationSample[0]));
            this._isEmpty = false;
        }

        // done!
        return true;
    }

    /**
     * Run the filter
     * @returns a 3x4 [ R | t ] matrix
     */
    run(): SpeedyMatrix
    {
        // how many samples should we use, at most?
        const div = (Settings.powerPreference == 'low-power') ? 1.5 : 1; // low-power ~ half the fps
        const T = Math.ceil(TRANSLATION_SAMPLES / div);
        const R = Math.ceil(ROTATION_SAMPLES / div);

        // clear the output of the filter
        const t = this._smoothTranslation._copyFrom(NO_TRANSLATION);
        const q = this._smoothRotation._copyFrom(ZERO_QUATERNION);

        // average translations
        for(let i = 0, d = 2 / (T * T + T); i < T; i++) {
            const ti = this._translationSample[i];
            const w = (T - i) * d;

            // weighted avg: sum from i=0 to T-1 { (T-i) * t[i] } * (2/(T^2+T))
            t.x += ti.x * w;
            t.y += ti.y * w;
            t.z += ti.z * w;
        }

        // average *nearby* rotations
        // based on https://web.archive.org/web/20130514122622/http://wiki.unity3d.com/index.php/Averaging_Quaternions_and_Vectors
        for(let i = 0; i < R; i++) {
            const qi = this._rotationSample[i];
            const w = 1 / R; //(R - (i - i%2)) / R;

            // since unit quaternions qi and -qi encode the same rotation
            // (see quaternion.ts), let's enforce dot(qi, 1) = qi.w >= 0
            if(qi.w < 0) {
                // XXX since Quaternion._fromRotationMatrix() computes w >= 0,
                // this will never happen. Leave this here for extra safety
                // in case anything changes?
                qi.x = -qi.x;
                qi.y = -qi.y;
                qi.z = -qi.z;
                qi.w = -qi.w;
            }

            q.x += qi.x * w;
            q.y += qi.y * w;
            q.z += qi.z * w;
            q.w += qi.w * w;
        }
        //q._normalize();

        // convert to matrix form and return
        const entries = q._toRotationMatrix().read();
        entries.push(t.x, t.y, t.z);
        return Speedy.Matrix(3, 4, entries);
    }
}
