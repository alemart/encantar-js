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
 * image-tracker-utils.ts
 * Image Tracker: Utilities
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { SpeedyPoint2 } from 'speedy-vision/types/core/speedy-point';
import { SpeedyVector2 } from 'speedy-vision/types/core/speedy-vector';
import { SpeedyKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
import { ReferenceImageWithMedia } from './reference-image';
import { Utils } from '../../utils/utils';
import { IllegalOperationError, IllegalArgumentError, NumericalError } from '../../utils/errors';
import { NIS_SIZE, TRACK_GRID_GRANULARITY } from './settings';
import { find6DoFHomography, find6DoFHomographyOptions } from '../../geometry/pnp';

/*

Definitions:
------------

1. Raster space:
   an image space whose top-left coordinate is (0,0) and whose bottom-right
   coordinate is (w-1,h-1), where (w,h) is its size. The y-axis points down.

2. AR screen size:
   size in pixels used for image processing operations. It's determined by the
   resolution of the tracker and by the aspect ratio of the input media.

3. AR screen space (screen):
   a raster space whose size is the AR screen size.

4. Normalized Image Space (NIS):
   a raster space whose size is N x N, where N = NIS_SIZE.

5. Normalized Device Coordinates (NDC):
   the normalized 2D space [-1,1]x[-1,1]. The origin is at the center and the
   y-axis points up.

*/

/** An ordered pair [src, dest] of keypoints */
export type ImageTrackerKeypointPair = [ Readonly<SpeedyKeypoint>, Readonly<SpeedyKeypoint> ];

/**
 * Utilities for the Image Tracker
 */
export class ImageTrackerUtils
{
    /**
     * Find a transformation that converts a raster space to NIS
     * @param size size of the raster space
     * @returns a 3x3 matrix
     */
    static rasterToNIS(size: SpeedySize): SpeedyMatrix
    {
        const sx = NIS_SIZE / size.width;
        const sy = NIS_SIZE / size.height;

        return Speedy.Matrix(3, 3, [
            sx, 0,  0,
            0,  sy, 0,
            0,  0,  1
        ]);
    }

    /**
     * Find a transformation that converts a raster space to NDC
     * @param size size of the raster space
     * @returns a 3x3 matrix
     */
    static rasterToNDC(size: SpeedySize): SpeedyMatrix
    {
        const w = size.width, h = size.height;

        return Speedy.Matrix(3, 3, [
            2/w, 0,   0,
            0,  -2/h, 0,
           -1,   1,   1
        ]);
    }

    /**
     * Find a transformation that converts NDC to a raster space
     * @param size size of the raster space
     * @returns a 3x3 matrix
     */
    static NDCToRaster(size: SpeedySize): SpeedyMatrix
    {
        const w = size.width, h = size.height;

        return Speedy.Matrix(3, 3, [
            w/2, 0,   0,
            0,  -h/2, 0,
            w/2, h/2, 1
        ]);
    }

    /**
     * Find a transformation that scales points in NDC
     * @param sx horizontal scale factor
     * @param sy vertical scale factor
     * @returns a 3x3 matrix
     */
    static scaleNDC(sx: number, sy: number = sx): SpeedyMatrix
    {
        // In NDC, the origin is at the center of the space!
        return Speedy.Matrix(3, 3, [
            sx, 0,  0,
            0,  sy, 0,
            0,  0,  1
        ]);
    }

    /**
     * Find a scale transformation in NDC such that the output has a desired aspect ratio
     * @param aspectRatio desired aspect ratio
     * @param scale optional scale factor in both axes
     * @returns a 3x3 matrix
     */
    static bestFitScaleNDC(aspectRatio: number, scale: number = 1): SpeedyMatrix
    {
        if(aspectRatio >= 1)
            return this.scaleNDC(scale, scale / aspectRatio); // s/(s/a) = a, sx >= sy
        else
            return this.scaleNDC(scale * aspectRatio, scale); // (s*a)/s = a, sx < sy
    }

    /**
     * Find the inverse matrix of bestFitScaleNDC()
     * @param aspectRatio as given to bestFitScaleNDC()
     * @param scale optional, as given to bestFitScaleNDC()
     * @returns a 3x3 matrix
     */
    static inverseBestFitScaleNDC(aspectRatio: number, scale: number = 1): SpeedyMatrix
    {
        if(aspectRatio >= 1)
            return this.scaleNDC(1 / scale, aspectRatio / scale);
        else
            return this.scaleNDC(1 / (scale * aspectRatio), 1 / scale);
    }

    /**
     * Find the best-fit aspect ratio for the rectification of the reference image in NDC
     * @param screenSize
     * @param referenceImage
     * @returns a best-fit aspect ratio
     */
    static bestFitAspectRatioNDC(screenSize: SpeedySize, referenceImage: ReferenceImageWithMedia): number
    {
        /*
        
        The best-fit aspectRatio (a) is constructed as follows:

        1) a fully stretched(*) and distorted reference image in NDC:
           a = 1

        2) a square in NDC:
           a = 1 / screenAspectRatio

        3) an image with the aspect ratio of the reference image in NDC:
           a = referenceImageAspectRatio * (1 / screenAspectRatio)

        (*) AR screen space

        By transforming the reference image twice, first by converting it to AR
        screen space, and then by rectifying it, we lose a little bit of quality.
        Nothing to be too concerned about, though?

        */

        const screenAspectRatio = screenSize.width / screenSize.height;
        return referenceImage.aspectRatio / screenAspectRatio;
    }

    /**
     * Given n > 0 pairs (src_i, dest_i) of keypoints in NIS,
     * convert them to NDC and output a 2 x 2n matrix of the form:
     * [ src_0.x  src_1.x  ... | dest_0.x  dest_1.x  ... ]
     * [ src_0.y  src_1.y  ... | dest_0.y  dest_1.y  ... ]
     * @param pairs pairs of keypoints in NIS
     * @returns 2 x 2n matrix with two 2 x n blocks: [ src | dest ]
     * @throws
     */
    static compilePairsOfKeypointsNDC(pairs: ImageTrackerKeypointPair[]): SpeedyMatrix
    {
        const n = pairs.length;

        if(n == 0)
            throw new IllegalArgumentError();

        const scale = 2 / NIS_SIZE;
        const data = new Array<number>(2 * 2*n);

        for(let i = 0, j = 0, k = 2*n; i < n; i++, j += 2, k += 2) {
            const src = pairs[i][0];
            const dest = pairs[i][1];

            data[j] = src.x * scale - 1; // convert from NIS to NDC
            data[j+1] = 1 - src.y * scale; // flip y-axis

            data[k] = dest.x * scale - 1;
            data[k+1] = 1 - dest.y * scale;
        }

        return Speedy.Matrix(2, 2*n, data);
    }

    /**
     * Interpolation filter for homographies
     * In its simplest form, it's similar to linear interpolation: src (1-alpha) + dest alpha
     * @param src homography
     * @param dest homography
     * @param alpha interpolation factor in [0,1] (1 means no interpolation)
     * @param beta correction strength for noisy corners (optional)
     * @param tau translation factor (optional)
     * @param omega rotational factor (optional)
     * @returns interpolated homography
     */
    static interpolateHomographies(src: SpeedyMatrix, dest: SpeedyMatrix, alpha: number, beta: number = 0, tau: number = 0, omega: number = 0): SpeedyPromise<SpeedyMatrix>
    {
        const d = new Array<number>(4), q = new Array<number>(8), p = [
            // NDC
            -1, 1,
            1, 1,
            1, -1,
            -1, -1,
        ];

        const ha = src.read(), hb = dest.read();
        for(let i = 0, j = 0; i < 4; i++, j += 2) {
            const x = p[j], y = p[j+1];

            const hax = ha[0] * x + ha[3] * y + ha[6];
            const hay = ha[1] * x + ha[4] * y + ha[7];
            const haz = ha[2] * x + ha[5] * y + ha[8];

            const hbx = hb[0] * x + hb[3] * y + hb[6];
            const hby = hb[1] * x + hb[4] * y + hb[7];
            const hbz = hb[2] * x + hb[5] * y + hb[8];

            const dx = hbx/hbz - hax/haz;
            const dy = hby/hbz - hay/haz;
            d[i] = dx*dx + dy*dy;
        }

        let tx = 0, ty = 0, sin = 0, cos = 1;
        const max = Math.max(d[0], d[1], d[2], d[3]); // max = Math.max(...d)
        const min = Math.min(d[0], d[1], d[2], d[3]);
        //const quality = min / max;

        // no change?
        if(max < 1e-5)
            return Speedy.Promise.resolve(Speedy.Matrix(dest));

        for(let i = 0, j = 0; i < 4; i++, j += 2) {
            const x = p[j], y = p[j+1];

            const hax = ha[0] * x + ha[3] * y + ha[6];
            const hay = ha[1] * x + ha[4] * y + ha[7];
            const haz = ha[2] * x + ha[5] * y + ha[8];

            const hbx = hb[0] * x + hb[3] * y + hb[6];
            const hby = hb[1] * x + hb[4] * y + hb[7];
            const hbz = hb[2] * x + hb[5] * y + hb[8];

            const ax = hax/haz, ay = hay/haz;
            const bx = hbx/hbz, by = hby/hbz;

            // correct noisy corners, if any
            if(d[i] == min) {
                // we take the min for the translation
                // because there may be noisy corners
                tx = bx - ax;
                ty = by - ay;

                const dot = ax * bx + ay * by;
                const signedArea = ax * by - ay * bx;
                const la2 = ax * ax + ay * ay;
                const lb2 = bx * bx + by * by;
                const lalb = Math.sqrt(la2 * lb2);

                sin = signedArea / lalb;
                cos = dot / lalb;
            }

            // compute the interpolation factor t = t(alpha, beta)
            // t is alpha if beta is zero
            const gamma = alpha * Math.pow(2, -beta);
            const f = 1 - Math.sqrt(d[i] / max); // f is zero when d[i] is max (hence, it minimizes t and contributes to src)
            const g = (alpha - gamma) * f + gamma; // gamma when f is zero; alpha when f is one
            //const t = Math.max(0, Math.min(g, 1)); // clamp
            const t = g; // allow extrapolation; don't clamp
            const _t = 1 - t;

            // a (1-t) + b t == a + (b-a) t
            q[ j ] = ax * _t + bx * t;
            q[j+1] = ay * _t + by * t;
        }

        const _omega = 1 - omega;
        for(let j = 0; j < 8; j += 2) {
            const x = q[j], y = q[j+1];
            q[ j ] = x * _omega + (x * cos - y * sin) * omega;
            q[j+1] = y * _omega + (x * sin + y * cos) * omega;
        }

        for(let j = 0; j < 8; j += 2) {
            q[ j ] += tx * tau;
            q[j+1] += ty * tau;
        }

        return Speedy.Matrix.perspective(
            Speedy.Matrix.Zeros(3),
            Speedy.Matrix(2, 4, p),
            Speedy.Matrix(2, 4, q)
        );
    }

    /**
     * Given n > 0 pairs of keypoints in NDC as a 2 x 2n [ src | dest ] matrix,
     * find a 6 DoF perspective warp (homography) from src to dest in NDC
     * @param cameraIntrinsics 3x3 camera intrinsics
     * @param points compiled pairs of keypoints in NDC
     * @param options to be passed to find6DofHomography
     * @returns a pair [ 3x3 transformation matrix, quality score ]
     */
    static find6DoFHomographyNDC(cameraIntrinsics: SpeedyMatrix, points: SpeedyMatrix, options: find6DoFHomographyOptions): SpeedyPromise<[SpeedyMatrix,number]>
    {
        // too few data points?
        const n = points.columns / 2;
        if(n < 4) {
            return Speedy.Promise.reject(
                new IllegalArgumentError(`Too few data points to compute a perspective warp`)
            );
        }

        // compute a homography
        const src = points.block(0, 1, 0, n-1);
        const dest = points.block(0, 1, n, 2*n-1);
        const mask = options.mask || Speedy.Matrix.Zeros(1, n);

        return find6DoFHomography(
            src,
            dest,
            cameraIntrinsics,
            Object.assign({ mask }, options)
        ).then(homography => {

            // check if this is a valid homography
            const a00 = homography.at(0,0);
            if(Number.isNaN(a00))
                throw new NumericalError(`Can't compute a perspective warp: bad keypoints`);

            // count inliers
            let m = 0;
            const inliers = mask.read();
            for(let i = 0; i < n; i++)
                m += inliers[i];

            // done!
            const score = m / n;
            return [homography, score];

        });
    }

    /**
     * Given n > 0 pairs of keypoints in NDC as a 2 x 2n [ src | dest ] matrix,
     * find a perspective warp (homography) from src to dest in NDC
     * @param points compiled pairs of keypoints in NDC
     * @param options to be passed to speedy-vision
     * @returns a pair [ 3x3 transformation matrix, quality score ]
     */
    static findPerspectiveWarpNDC(points: SpeedyMatrix, options: object): SpeedyPromise<[SpeedyMatrix,number]>
    {
        // too few data points?
        const n = points.columns / 2;
        if(n < 4) {
            return Speedy.Promise.reject(
                new IllegalArgumentError(`Too few data points to compute a perspective warp`)
            );
        }

        // compute a homography
        const src = points.block(0, 1, 0, n-1);
        const dest = points.block(0, 1, n, 2*n-1);
        const mask = ((options as any).mask as SpeedyMatrix | null | undefined) || Speedy.Matrix.Zeros(1, n);

        return Speedy.Matrix.findHomography(
            Speedy.Matrix.Zeros(3),
            src,
            dest,
            Object.assign({ mask }, options)
        ).then(homography => {

            // check if this is a valid warp
            const a00 = homography.at(0,0);
            if(Number.isNaN(a00))
                throw new NumericalError(`Can't compute a perspective warp: bad keypoints`);

            // count inliers
            let m = 0;
            const inliers = mask.read();
            for(let i = 0; i < n; i++)
                m += inliers[i];

            // done!
            const score = m / n;
            return [homography, score];

        });
    }

    /**
     * Given n > 0 pairs of keypoints in NDC as a 2 x 2n [ src | dest ] matrix,
     * find an affine warp from src to dest in NDC. The affine warp is given as
     * a 3x3 matrix whose last row is [0 0 1]
     * @param points compiled pairs of keypoints in NDC
     * @param options to be passed to speedy-vision
     * @returns a pair [ 3x3 transformation matrix, quality score ]
     */
    static findAffineWarpNDC(points: SpeedyMatrix, options: object): SpeedyPromise<[SpeedyMatrix,number]>
    {
        // too few data points?
        const n = points.columns / 2;
        if(n < 3) {
            return Speedy.Promise.reject(
                new IllegalArgumentError(`Too few data points to compute an affine warp`)
            );
        }

        // compute an affine transformation
        const model = Speedy.Matrix.Eye(3);
        const src = points.block(0, 1, 0, n-1);
        const dest = points.block(0, 1, n, 2*n-1);
        const mask = ((options as any).mask as SpeedyMatrix | null | undefined) || Speedy.Matrix.Zeros(1, n);

        return Speedy.Matrix.findAffineTransform(
            model.block(0, 1, 0, 2), // 2x3 submatrix
            src,
            dest,
            Object.assign({ mask }, options)
        ).then(_ => {

            // check if this is a valid warp
            const a00 = model.at(0,0);
            if(Number.isNaN(a00))
                throw new NumericalError(`Can't compute an affine warp: bad keypoints`);

            // count inliers
            let m = 0;
            const inliers = mask.read();
            for(let i = 0; i < n; i++)
                m += inliers[i];

            // done!
            const score = m / n;
            return [model, score];

        });
    }

    /**
     * Find a polyline in Normalized Device Coordinates (NDC)
     * @param homography maps the corners of NDC to a quadrilateral in NDC
     * @returns 4 points in NDC
     */
    static findPolylineNDC(homography: SpeedyMatrix): SpeedyPoint2[]
    {
        const h = homography.read();
        const uv = [ -1, +1,    -1, -1,    +1, -1,    +1, +1 ]; // the corners of a reference image in NDC
        const polyline = new Array<SpeedyPoint2>(4);

        for(let i = 0, j = 0; i < 4; i++, j += 2) {
            const u = uv[j], v = uv[j+1];

            const x = h[0]*u + h[3]*v + h[6];
            const y = h[1]*u + h[4]*v + h[7];
            const w = h[2]*u + h[5]*v + h[8];

            polyline[i] = Speedy.Point2(x/w, y/w);
        }

        return polyline;
    }

    /**
     * Find a better spatial distribution of the input matches
     * @param pairs in the [src, dest] format
     * @returns refined pairs of quality matches
     */
    static refineMatchingPairs(pairs: ImageTrackerKeypointPair[]): ImageTrackerKeypointPair[]
    {
        // collect all keypoints obtained in this frame
        const m = pairs.length;
        const destKeypoints = new Array<SpeedyKeypoint>(m);

        for(let j = 0; j < m; j++)
            destKeypoints[j] = pairs[j][1];

        // find a better spatial distribution of the keypoints
        const indices = this._distributeKeypoints(destKeypoints);

        // assemble output
        const n = indices.length; // number of refined matches
        const result = new Array<ImageTrackerKeypointPair>(n);

        for(let i = 0; i < n; i++)
            result[i] = pairs[indices[i]];

        // done!
        return result;
    }

    /**
     * Spatially distribute keypoints over a grid
     * @param keypoints keypoints to be distributed
     * @returns a list of indices of keypoints[]
     */
    private static _distributeKeypoints(keypoints: SpeedyKeypoint[]): number[]
    {
        // create a grid
        const gridCells = TRACK_GRID_GRANULARITY; // number of grid elements in each axis
        const numberOfCells = gridCells * gridCells;
        const n = keypoints.length;

        // get the coordinates of the keypoints
        const points: number[] = new Array(2 * n);
        for(let i = 0, j = 0; i < n; i++, j += 2) {
            points[j] = keypoints[i].x;
            points[j+1] = keypoints[i].y;
        }

        // normalize the coordinates to [0,1) x [0,1)
        this._normalizePoints(points);

        // distribute the keypoints over the grid
        const grid = new Array<number>(numberOfCells).fill(-1);
        for(let i = 0, j = 0; i < n; i++, j += 2) {
            // find the grid location of the i-th point
            const xg = Math.floor(points[j] * gridCells); // 0 <= xg,yg < gridCells
            const yg = Math.floor(points[j+1] * gridCells);

            // store the index of the i-th point in the grid
            const k = yg * gridCells + xg;
            if(grid[k] < 0)
                grid[k] = i;
        }

        // retrieve points of the grid
        let m = 0;
        const indices = new Array<number>(numberOfCells);
        for(let g = 0; g < numberOfCells; g++) {
            if(grid[g] >= 0)
                indices[m++] = grid[g];
        }
        indices.length = m;

        // done!
        return indices;
    }

    /**
     * Normalize points to [0,1)^2
     * @param points 2 x n matrix of points in column-major format
     * @returns points
     */
    private static _normalizePoints(points: number[]): number[]
    {
        Utils.assert(points.length % 2 == 0);

        const n = points.length / 2;
        if(n == 0)
            return points;

        let xmin = Number.POSITIVE_INFINITY, xmax = Number.NEGATIVE_INFINITY;
        let ymin = Number.POSITIVE_INFINITY, ymax = Number.NEGATIVE_INFINITY;
        for(let i = 0, j = 0; i < n; i++, j += 2) {
            const x = points[j], y = points[j+1];
            xmin = x < xmin ? x : xmin;
            ymin = y < ymin ? y : ymin;
            xmax = x > xmax ? x : xmax;
            ymax = y > ymax ? y : ymax;
        }

        const xlen = xmax - xmin + 1; // +1 is a correction factor, so that 0 <= x,y < 1
        const ylen = ymax - ymin + 1;
        for(let i = 0, j = 0; i < n; i++, j += 2) {
            points[j] = (points[j] - xmin) / xlen;
            points[j+1] = (points[j+1] - ymin) / ylen;
        }

        return points;
    }
}
