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
 * camera-model.ts
 * Camera model
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { SpeedyPoint2 } from 'speedy-vision/types/core/speedy-point';
import { SpeedyVector2 } from 'speedy-vision/types/core/speedy-vector';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { Nullable, Utils } from '../utils/utils';
import { Settings } from '../core/settings';
import { IllegalOperationError, IllegalArgumentError } from '../utils/errors';

/** A guess of the horizontal field-of-view of a typical camera, in degrees */
const HFOV_GUESS = 60; // https://developer.apple.com/library/archive/documentation/DeviceInformation/Reference/iOSDeviceCompatibility/Cameras/Cameras.html

/** Number of iterations used to refine the estimated pose */
const POSE_ITERATIONS = 30;

/** Number of samples used in the rotation filter */
const ROTATION_FILTER_SAMPLES = 10;

/** Number of samples used in the translation filter */
const TRANSLATION_FILTER_SAMPLES = 5;

/** Convert degrees to radians */
const DEG2RAD = 0.017453292519943295; // pi / 180

/** Convert radians to degrees */
const RAD2DEG = 57.29577951308232; // 180 / pi

/** Numerical tolerance */
const EPSILON = 1e-6;

/** Index of the horizontal focal length in the camera intrinsics matrix (column-major format) */
export const FX = 0;

/** Index of the vertical focal length in the camera intrinsics matrix */
export const FY = 4;

/** Index of the horizontal position of the principal point in the camera intrinsics matrix */
export const U0 = 6;

/** Index of the vertical position of the principal point in the camera intrinsics matrix */
export const V0 = 7;




/**
 * Camera model
 */
export class CameraModel
{
    /** size of the image sensor, in pixels */
    private _screenSize: SpeedySize;

    /** 3x4 camera matrix */
    private _matrix: SpeedyMatrix;

    /** intrinsics matrix, in column-major format */
    private _intrinsics: number[];

    /** extrinsics matrix, in column-major format */
    private _extrinsics: number[];

    /** filter: samples of partial rotation matrix [ r1 | r2 ] */
    private _partialRotationBuffer: number[][];

    /** filter: samples of translation vector t */
    private _translationBuffer: number[][];



    /**
     * Constructor
     */
    constructor()
    {
        this._screenSize = Speedy.Size(0, 0);
        this._matrix = Speedy.Matrix.Eye(3, 4);
        this._intrinsics = [1,0,0,0,1,0,0,0,1]; // 3x3 identity matrix
        this._extrinsics = [1,0,0,0,1,0,0,0,1,0,0,0]; // 3x4 matrix [ R | t ] = [ I | 0 ] no rotation & no translation
        this._partialRotationBuffer = [];
        this._translationBuffer = [];
    }

    /**
     * Initialize the model
     * @param screenSize
     */
    init(screenSize: SpeedySize): void
    {
        // validate
        if(screenSize.area() == 0)
            throw new IllegalArgumentError(`Can't initialize the camera model with screenSize = ${screenSize.toString()}`);

        // set the screen size
        this._screenSize.width = screenSize.width;
        this._screenSize.height = screenSize.height;

        // reset the model
        this.reset();

        // log
        Utils.log(`Initializing the camera model...`);
    }

    /**
     * Release the model
     */
    release(): null
    {
        this.reset();
        return null;
    }

    /**
     * Update the camera model
     * @param homography 3x3 perspective transform
     * @param screenSize may change over time (e.g., when going from portrait to landscape or vice-versa)
     * @returns promise that resolves to a camera matrix
     */
    update(homography: SpeedyMatrix, screenSize: SpeedySize): SpeedyPromise<SpeedyMatrix>
    {
        // validate the shape of the homography
        if(homography.rows != 3 || homography.columns != 3)
            throw new IllegalArgumentError(`Camera model: provide a homography matrix`);

        // validate screenSize
        if(screenSize.area() == 0)
            throw new IllegalArgumentError(`Camera model: invalid screenSize = ${screenSize.toString()}`);

        // changed screen size?
        if(!this._screenSize.equals(screenSize)) {
            Utils.log(`Camera model: detected a change in screen size...`);

            // update the screen size
            this._screenSize.width = screenSize.width;
            this._screenSize.height = screenSize.height;

            // reset camera
            this.reset();
        }

        // read the entries of the homography
        const h = homography.read();
        const h11 = h[0], h12 = h[3], h13 = h[6],
              h21 = h[1], h22 = h[4], h23 = h[7],
              h31 = h[2], h32 = h[5], h33 = h[8];

        // validate the homography (homography matrices aren't singular)
        const det = h13 * (h21 * h32 - h22 * h31) - h23 * (h11 * h32 - h12 * h31) + h33 * (h11 * h22 - h12 * h21);
        if(Math.abs(det) < EPSILON) {
            Utils.warning(`Can't update the camera model using an invalid homography matrix`);
            return Speedy.Promise.resolve(this._matrix);
        }

        // estimate the pose
        const pose = this._estimatePose(homography);
        this._extrinsics = pose.read();

        // compute the camera matrix
        const C = this.denormalizer();
        const K = Speedy.Matrix(3, 3, this._intrinsics);
        const E = pose; //Speedy.Matrix(3, 4, this._extrinsics);
        this._matrix.setToSync(K.times(E).times(C));
        //console.log("intrinsics -----------", K.toString());
        //console.log("matrix ----------------",this._matrix.toString());
        return Speedy.Promise.resolve(this._matrix);
    }

    /**
     * Reset camera model
     */
    reset(): void
    {
        this._resetIntrinsics();
        this._resetExtrinsics();
    }

    /**
     * The camera matrix that maps the 3D normalized space [-1,1]^3 to the
     * 2D AR screen space (measured in pixels)
     * @returns 3x4 camera matrix
     */
    get matrix(): SpeedyMatrix
    {
        return this._matrix;
    }

    /**
     * Camera intrinsics matrix
     * @returns 3x3 intrinsics matrix in column-major format
     */
    get intrinsics(): number[]
    {
        return this._intrinsics;
    }

    /**
     * Camera extrinsics matrix
     * @returns 3x4 extrinsics matrix [ R | t ] in column-major format
     */
    get extrinsics(): number[]
    {
        return this._extrinsics;
    }

    /**
     * Convert coordinates from normalized space [-1,1]^3 to a
     * "3D pixel space" based on the dimensions of the AR screen.
     *
     * We perform a 180-degrees rotation around the x-axis so that
     * it looks nicer (the y-axis grows downwards in image space).
     *
     * The final camera matrix is P = K * [ R | t ] * C, where
     * C is this conversion matrix. The intent behind this is to
     * make tracking independent of target and screen sizes.
     *
     * Reminder: we use a right-handed coordinate system in 3D!
     * In 2D image space the coordinate system is left-handed.
     *
     * @returns 4x4 conversion matrix C
     */
    denormalizer(): SpeedyMatrix
    {
        const w = this._screenSize.width / 2; // half width, in pixels
        const h = this._screenSize.height / 2; // half height, in pixels
        const d = Math.min(w, h); // virtual unit length, in pixels

        /*
        return Speedy.Matrix(4, 4, [
            1, 0, 0, 0,
            0,-1, 0, 0,
            0, 0,-1, 0,
            w/d, h/d, 0, 1/d
        ]);
        */

        return Speedy.Matrix(4, 4, [
            d, 0, 0, 0,
            0,-d, 0, 0,
            0, 0,-d, 0,
            w, h, 0, 1,
        ]);
    }

    /**
     * Size of the AR screen space, in pixels
     * @returns size in pixels
     */
    get screenSize(): SpeedySize
    {
        return this._screenSize;
    }

    /**
     * Focal length in pixel units (projection distance in the pinhole camera model)
     * same as (focal length in mm) * (number of pixels per world unit in pixels/mm)
     * @returns focal length
     */
    get focalLength(): number
    {
        return this._intrinsics[FY]; // fx == fy
    }

    /**
     * Horizontal field-of-view, given in radians
     * @returns vertical field-of-view
     */
    get fovx(): number
    {
        return 2 * Math.atan(this._intrinsics[U0] / this._intrinsics[FX]);
    }

    /**
     * Vertical field-of-view, given in radians
     * @returns vertical field-of-view
     */
    get fovy(): number
    {
        return 2 * Math.atan(this._intrinsics[V0] / this._intrinsics[FY]);
    }

    /**
     * Principal point
     * @returns principal point, in pixel coordinates
     */
    principalPoint(): SpeedyPoint2
    {
        return Speedy.Point2(this._intrinsics[U0], this._intrinsics[V0]);
    }

    /**
     * Reset camera extrinsics
     */
    private _resetExtrinsics(): void
    {
        // set the rotation matrix to the identity
        this._extrinsics.fill(0);
        this._extrinsics[0] = this._extrinsics[4] = this._extrinsics[8] = 1;

        // reset filters
        this._partialRotationBuffer.length = 0;
        this._translationBuffer.length = 0;
    }

    /**
     * Reset camera intrinsics
     */
    private _resetIntrinsics(): void
    {
        const cameraWidth = Math.max(this._screenSize.width, this._screenSize.height); // portrait?

        const u0 = this._screenSize.width / 2;
        const v0 = this._screenSize.height / 2;
        const fx = (cameraWidth / 2) / Math.tan(DEG2RAD * HFOV_GUESS / 2);
        const fy = fx;

        this._intrinsics[FX] = fx;
        this._intrinsics[FY] = fy;
        this._intrinsics[U0] = u0;
        this._intrinsics[V0] = v0;
    }

    /**
     * Compute a normalized homography H^ = K^(-1) * H for an
     * ideal pinhole with f = 1 and principal point = (0,0)
     * @param homography homography H to be normalized
     * @returns normalized homography H^
     */
    private _normalizeHomography(homography: SpeedyMatrix): SpeedyMatrix
    {
        const h = homography.read();
        const u0 = this._intrinsics[U0];
        const v0 = this._intrinsics[V0];
        const fx = this._intrinsics[FX];
        const fy = this._intrinsics[FY];
        const u0fx = u0 / fx;
        const v0fy = v0 / fy;

        const h11 = h[0] / fx - u0fx * h[2], h12 = h[3] / fx - u0fx * h[5], h13 = h[6] / fx - u0fx * h[8];
        const h21 = h[1] / fy - v0fy * h[2], h22 = h[4] / fy - v0fy * h[5], h23 = h[7] / fy - v0fy * h[8];
        const h31 = h[2], h32 = h[5], h33 = h[8];

        /*console.log([
            h11, h21, h31,
            h12, h22, h32,
            h13, h23, h33,
        ]);*/

        return Speedy.Matrix(3, 3, [
            h11, h21, h31,
            h12, h22, h32,
            h13, h23, h33,
        ]);
    }

    /**
     * Estimate [ r1 | r2 | t ], where r1, r2 are orthonormal and t is a translation vector
     * @param normalizedHomography based on the ideal pinhole (where calibration K = I)
     * @returns a 3x3 matrix
     */
    private _estimatePartialPose(normalizedHomography: SpeedyMatrix): SpeedyMatrix
    {
        const h = normalizedHomography.read();
        const h11 = h[0], h12 = h[3], h13 = h[6];
        const h21 = h[1], h22 = h[4], h23 = h[7];
        const h31 = h[2], h32 = h[5], h33 = h[8];

        const h1norm2 = h11 * h11 + h21 * h21 + h31 * h31;
        const h2norm2 = h12 * h12 + h22 * h22 + h32 * h32;
        const h1norm = Math.sqrt(h1norm2);
        const h2norm = Math.sqrt(h2norm2);
        //const hnorm = (h1norm + h2norm) / 2;
        //const hnorm = Math.sqrt(h1norm * h2norm);
        const hnorm = Math.max(h1norm, h2norm); // this seems to work. why?

        // we expect h1norm to be approximately h2norm, but sometimes there is a lot of noise
        // if h1norm is not approximately h2norm, it means that the first two columns of
        // the normalized homography are not really encoding a rotation (up to a scale)

        //console.log("h1,h2",h1norm,h2norm);
        //console.log(normalizedHomography.toString());

        // compute a rough estimate for the scale factor
        // select the sign so that t3 = tz > 0
        const sign = h33 >= 0 ? 1 : -1;
        let scale = sign / hnorm;

        // sanity check
        if(Number.isNaN(scale))
            return Speedy.Matrix(3, 3, (new Array(9)).fill(Number.NaN));

        // recover the rotation
        let r = new Array(6) as number[];
        r[0] = scale * h11;
        r[1] = scale * h21;
        r[2] = scale * h31;
        r[3] = scale * h12;
        r[4] = scale * h22;
        r[5] = scale * h32;

        // refine the rotation
        r = this._refineRotation(r); // r is initially noisy

        /*

        After refining the rotation vectors, let's adjust the scale factor as
        follows:

        We know that [ r1 | r2 | t ] is equal to the normalized homography H up
        to a non-zero scale factor s, i.e., [ r1 | r2 | t ] = s H. Let's call M
        the first two columns of H, i.e., M = [ h1 | h2 ], and R = [ r1 | r2 ].
        It follows that R = s M, meaning that M'R = s M'M. The trace of 2x2 M'R
        is such that tr(M'R) = tr(s M'M) = s tr(M'M), which means:

        s = tr(M'R) / tr(M'M) = (r1'h1 + r2'h2) / (h1'h1 + h2'h2)

        (also: s^2 = det(M'R) / det(M'M))

        */

        // adjust the scale factor
        scale = r[0] * h11 + r[1] * h21 + r[2] * h31;
        scale += r[3] * h12 + r[4] * h22 + r[5] * h32;
        scale /= h1norm2 + h2norm2;

        // recover the translation
        let t = new Array(3) as number[];
        t[0] = scale * h13;
        t[1] = scale * h23;
        t[2] = scale * h33;

        // done!
        return Speedy.Matrix(3, 3, r.concat(t));
    }

    /**
     * Make two non-zero and non-parallel input vectors, r1 and r2, orthonormal
     * @param rot rotation vectors [ r1 | r2 ] in column-major format
     * @returns a 3x2 matrix R such that R'R = I (column-major format)
     */
    private _refineRotation(rot: number[]): number[]
    {
        const [r11, r21, r31, r12, r22, r32] = rot;

        /*

        A little technique I figured out to correct the rotation vectors
        ----------------------------------------------------------------

        We are given two 3x1 column-vectors r1 and r2 as input in a 3x2 matrix
        R = [ r1 | r2 ]. We would like that R'R = I, but that won't be the case
        because vectors r1 and r2 are not perfectly orthonormal due to noise.

        Let's first notice that R'R is symmetric. You can easily check that its
        two eigenvalues are both real and positive (as long as r1, r2 != 0 and
        r1 is not parallel to r2, but we never take such vectors as input).

        R'R = [ r1'r1   r1'r2 ]  is of rank 2, positive-definite
              [ r1'r2   r2'r2 ]

        We proceed by computing an eigendecomposition Q D Q' of R'R, where Q is
        chosen to be orthogonal and D is a diagonal matrix whose entries are
        the eigenvalues of R'R.

        Let LL' be the Cholesky decomposition of D. Such decomposition exists
        and is trivially computed: just take the square roots of the entries of
        D. Since L is diagonal, we have L = L'. Its inverse is also trivially
        computed - call it Linv.

        Now, define a 2x2 correction matrix C as follows:

        C = Q * Linv * Q'

        This matrix rotates the input vector, scales it by some amount, and
        then rotates it back to where it was (i.e., Q'Q = Q Q' = I).

        We compute RC in order to correct the rotation vectors. We take its
        two columns as the corrected vectors.

        In order to show that the two columns of RC are orthonormal, we can
        show that (RC)'(RC) = I. Indeed, noticing that C is symmetric, let's
        expand the expression:

        (RC)'(RC) = C'R'R C = C R'R C = (Q Linv Q') (Q D Q') (Q Linv Q') =
        Q Linv (Q'Q) D (Q'Q) Linv Q' = Q Linv D Linv Q' =
        Q Linv (L L) Linv Q' = Q (Linv L) (L Linv) Q' = Q Q' = I

        I have provided below a closed formula to correct the rotation vectors.

        What C does to R is very interesting: it makes the singular values
        become 1. If U S V' is a SVD of R, then R'R = V S^2 V'. The singular
        values of R are the square roots of the eigenvalues of R'R. Letting
        S = L and V = Q, it follows that RC = U S V' V Linv V' = U V'. This
        means that RC is equivalent to the correction "trick" using the SVD
        found in the computer vision literature (i.e., compute the SVD and
        return U V'). That "trick" is known to return the rotation matrix that
        minimizes the Frobenius norm of the difference between the input and
        the output. Consequently, the technique I have just presented is also
        optimal in that sense!

        By the way, the input matrix R does not need to be 3x2.

        */

        // compute the entries of R'R
        const r1tr1 = r11*r11 + r21*r21 + r31*r31;
        const r2tr2 = r12*r12 + r22*r22 + r32*r32;
        const r1tr2 = r11*r12 + r21*r22 + r31*r32;

        // compute the two real eigenvalues of R'R
        const delta = (r1tr1 - r2tr2) * (r1tr1 - r2tr2) + 4 * r1tr2 * r1tr2;
        const sqrt = Math.sqrt(delta); // delta >= 0 always
        const eigval1 = (r1tr1 + r2tr2 + sqrt) / 2;
        const eigval2 = (r1tr1 + r2tr2 - sqrt) / 2;

        // compute two unit eigenvectors qi = (xi,yi) of R'R
        const alpha1 = (r2tr2 - eigval1) - r1tr2 * (1 + r1tr2) / (r1tr1 - eigval1);
        const x1 = Math.sqrt((alpha1 * alpha1) / (1 + alpha1 * alpha1));
        const y1 = x1 / alpha1;

        const alpha2 = (r2tr2 - eigval2) - r1tr2 * (1 + r1tr2) / (r1tr1 - eigval2);
        const x2 = Math.sqrt((alpha2 * alpha2) / (1 + alpha2 * alpha2));
        const y2 = x2 / alpha2;

        // compute the Cholesky decomposition LL' of the diagonal matrix D
        // whose entries are the two eigenvalues of R'R and then invert L
        const s1 = Math.sqrt(eigval1), s2 = Math.sqrt(eigval2); // singular values of R (pick s1 >= s2)
        const Linv = Speedy.Matrix(2, 2, [1/s1, 0, 0, 1/s2]); // L inverse

        // compute the correction matrix C = Q * Linv * Q', where Q = [q1|q2]
        // is orthogonal and Linv is computed as above
        const Q = Speedy.Matrix(2, 2, [x1, y1, x2, y2]);
        const Qt = Speedy.Matrix(2, 2, [x1, x2, y1, y2]);
        const C = Q.times(Linv).times(Qt);

        // correct the rotation vectors r1 and r2 using C
        const R = Speedy.Matrix(3, 2, [r11, r21, r31, r12, r22, r32]);
        return Speedy.Matrix(R.times(C)).read();
    }

    /**
     * Compute a refined translation vector
     * @param normalizedHomography ideal pinhole K = I
     * @param rot rotation vectors [ r1 | r2 ] in column-major format
     * @param t0 initial estimate for the translation vector
     * @returns 3x1 translation vector in column-major format
     */
    private _refineTranslation(normalizedHomography: SpeedyMatrix, rot: number[], t0: number[]): number[]
    {
        /*

        Given a normalized homography H, the rotation vectors r1, r2, and a
        translation vector t, we know that [ r1 | r2 | t ] = s H for a non-zero
        scale factor s.

        If we take a homogeneous vector u = [ x  y  w ]' (i.e., w = 1), then
        [ r1 | r2 | t ] u is parallel to H u, which means that their cross
        product is zero:

        [ r1 | r2 | t ] u  x  H u  =  ( x r1 + y r2 + w t )  x  H u  =  0

        The following code finds an optimal translation vector t based on the
        above observation. H, r1, r2 are known.

        */

        const h = normalizedHomography.read();
        const h11 = h[0], h12 = h[3], h13 = h[6];
        const h21 = h[1], h22 = h[4], h23 = h[7];
        const h31 = h[2], h32 = h[5], h33 = h[8];

        const r11 = rot[0], r12 = rot[3];
        const r21 = rot[1], r22 = rot[4];
        const r31 = rot[2], r32 = rot[5];

        // sample points [ xi  yi ]' in AR screen space
        //const x = [ 0.5, 0.0, 1.0, 1.0, 0.0, 0.5, 1.0, 0.5, 0.0 ];
        //const y = [ 0.5, 0.0, 0.0, 1.0, 1.0, 0.0, 0.5, 1.0, 0.5 ];
        const x = [ 0.5, 0.0, 1.0, 1.0, 0.0 ];
        const y = [ 0.5, 0.0, 0.0, 1.0, 1.0 ];
        const n = x.length;
        const n3 = 3*n;

        const width = this._screenSize.width;
        const height = this._screenSize.height;
        for(let i = 0; i < n; i++) {
            x[i] *= width;
            y[i] *= height;
        }

        // set auxiliary values: ai = H [ xi  yi  1 ]'
        const a1 = new Array(n) as number[];
        const a2 = new Array(n) as number[];
        const a3 = new Array(n) as number[];
        for(let i = 0; i < n; i++) {
            a1[i] = x[i] * h11 + y[i] * h12 + h13;
            a2[i] = x[i] * h21 + y[i] * h22 + h23;
            a3[i] = x[i] * h31 + y[i] * h32 + h33;
        }

        // we'll solve M t = v for t with linear least squares
        // M: 3n x 3, v: 3n x 1, t: 3 x 1
        const m = new Array(3*n * 3) as number[];
        const v = new Array(3*n) as number[];
        for(let i = 0, k = 0; k < n; i += 3, k++) {
            m[i] = m[i+n3+1] = m[i+n3+n3+2] = 0;
            m[i+n3] = -(m[i+1] = a3[k]);
            m[i+2] = -(m[i+n3+n3] = a2[k]);
            m[i+n3+n3+1] = -(m[i+n3+2] = a1[k]);
            v[i] = a3[k] * (x[k] * r21 + y[k] * r22) - a2[k] * (x[k] * r31 + y[k] * r32);
            v[i+1] = -a3[k] * (x[k] * r11 + y[k] * r12) + a1[k] * (x[k] * r31 + y[k] * r32);
            v[i+2] = a2[k] * (x[k] * r11 + y[k] * r12) - a1[k] * (x[k] * r21 + y[k] * r22);
        }

        /*
        // this works, but I want more lightweight
        const M = Speedy.Matrix(n3, 3, m);
        const v_ = Speedy.Matrix(n3, 1, v);
        return Speedy.Matrix(M.ldiv(v_)).read();
        */

        /*

        Gradient descent with optimal step size / learning rate
        -------------------------------------------------------

        Let's find the column-vector x that minimizes the error function
        E(x) = r'r, where r = Ax - b, using gradient descent. This is linear
        least squares. We want to find x easily, QUICKLY and iteratively.

        The update rule of gradient descent is set to:

        x := x - w * grad(E)

        where w is the learning rate and grad(E) is the gradient of E(x):
        
        grad(E) = 2 A'r = 2 A'(Ax - b) = 2 A'A x - 2 A'b
        
        Let's adjust w to make x "converge quickly". Define function S(w) as:

        S(w) = x - w * grad(E)    (step)

        and another function F(w) as:

        F(w) = E(S(w))

        which is the error of the step. We minimize F by setting its derivative
        to zero:

        0 = dF = dF dS
            dw   dS dw

        What follows is a fair amount of algebra. Do the math and you'll find
        the following optimal update rule:

                     (c'c)
        x := x  -  --------- c
                   (Ac)'(Ac)

        where c = A'r = A'(Ax - b)

        */

        // gradient descent: super lightweight implementation
        const r = new Array(3*n) as number[];
        const c = new Array(3) as number[];
        const Mc = new Array(3*n) as number[];

        // initial guess
        const t = new Array(3) as number[];
        t[0] = t0[0];
        t[1] = t0[1];
        t[2] = t0[2];

        // iterate
        const MAX_ITERATIONS = 15;
        const TOLERANCE = 1;
        for(let it = 0; it < MAX_ITERATIONS; it++) {
            //console.log("it",it+1);

            // compute residual r = Mt - v
            for(let i = 0; i < n3; i++) {
                r[i] = 0;
                for(let j = 0; j < 3; j++)
                    r[i] += m[j*n3 + i] * t[j];
                r[i] -= v[i];
            }

            // compute c = M'r
            for(let i = 0; i < 3; i++) {
                c[i] = 0;
                for(let j = 0; j < n3; j++)
                    c[i] += m[i*n3 + j] * r[j];
            }

            // compute Mc
            for(let i = 0; i < n3; i++) {
                Mc[i] = 0;
                for(let j = 0; j < 3; j++)
                    Mc[i] += m[j*n3 + i] * c[j];
            }

            // compute c'c
            let num = 0;
            for(let i = 0; i < 3; i++)
                num += c[i] * c[i];
            //console.log("c'c=",num);
            if(num < TOLERANCE)
                break;

            // compute (Mc)'(Mc)
            let den = 0;
            for(let i = 0; i < n3; i++)
                den += Mc[i] * Mc[i];

            // compute frc = c'c / (Mc)'(Mc)
            const frc = num / den;
            if(Number.isNaN(frc)) // this shouldn't happen
                break;

            // iterate: t = t - frc * c
            for(let i = 0; i < 3; i++)
                t[i] -= frc * c[i];

        }

        //console.log("OLD t:\n\n",t0.join('\n'));
        //console.log("new t:\n\n",t.join('\n'));

        // done!
        return t;
    }

    /**
     * Apply a smoothing filter to the partial pose
     * @param partialPose 3x3 [ r1 | r2 | t ]
     * @returns filtered partial pose
     */
    private _filterPartialPose(partialPose: SpeedyMatrix): SpeedyMatrix
    {
        const avg: number[] = new Array(9).fill(0);
        const entries = partialPose.read();
        const rotationBlock = entries.slice(0, 6);
        const translationBlock = entries.slice(6, 9);

        // how many samples should we store, at most?
        const div = (Settings.powerPreference == 'low-power') ? 1.5 : 1; // low-power ~ half the fps
        const N = Math.ceil(ROTATION_FILTER_SAMPLES / div);
        const M = Math.ceil(TRANSLATION_FILTER_SAMPLES / div);

        // is it a valid partial pose?
        if(!Number.isNaN(entries[0])) {
            // store samples
            this._partialRotationBuffer.unshift(rotationBlock);
            if(this._partialRotationBuffer.length > N)
                this._partialRotationBuffer.length = N;

            this._translationBuffer.unshift(translationBlock);
            if(this._translationBuffer.length > M)
                this._translationBuffer.length = M;
        }
        else if(this._partialRotationBuffer.length == 0) {
            // invalid pose, no samples
            return Speedy.Matrix.Eye(3);
        }

        // average *nearby* rotations
        const n = this._partialRotationBuffer.length;
        for(let i = 0; i < n; i++) {
            const r = this._partialRotationBuffer[i];
            for(let j = 0; j < 6; j++)
                avg[j] += r[j] / n;
        }
        const r = this._refineRotation(avg);

        // average translations
        const m = this._translationBuffer.length;
        for(let i = 0; i < m; i++) {
            const t = this._translationBuffer[i];
            for(let j = 0; j < 3; j++)
                avg[6 + j] += (m - i) * t[j] / ((m * m + m) / 2);
                //avg[6 + j] += t[j] / m;
        }
        const t = [ avg[6], avg[7], avg[8] ];

        // done!
        return Speedy.Matrix(3, 3, r.concat(t));
    }

    /**
     * Estimate extrinsics [ R | t ] given a partial pose [ r1 | r2 | t ]
     * @param partialPose
     * @returns 3x4 matrix
     */
    private _estimateFullPose(partialPose: SpeedyMatrix): SpeedyMatrix
    {
        const p = partialPose.read();
        const r11 = p[0], r12 = p[3], t1 = p[6];
        const r21 = p[1], r22 = p[4], t2 = p[7];
        const r31 = p[2], r32 = p[5], t3 = p[8];

        // r3 = +- ( r1 x r2 )
        let r13 = r21 * r32 - r31 * r22;
        let r23 = r31 * r12 - r11 * r32;
        let r33 = r11 * r22 - r21 * r12;

        // let's make sure that det R = +1 (keep the orientation)
        const det = r11 * (r22 * r33 - r23 * r32) - r21 * (r12 * r33 - r13 * r32) + r31 * (r12 * r23 - r13 * r22);
        if(det < 0) {
            r13 = -r13;
            r23 = -r23;
            r33 = -r33;
        }

        // done!
        return Speedy.Matrix(3, 4, [
            r11, r21, r31,
            r12, r22, r32,
            r13, r23, r33,
            t1, t2, t3,           
        ]);
    }

    /**
     * Estimate the pose [ R | t ] given a homography in AR screen space
     * @param homography must be valid
     * @returns 3x4 matrix
     */
    private _estimatePose(homography: SpeedyMatrix): SpeedyMatrix
    {
        const normalizedHomography = this._normalizeHomography(homography);
        const partialPose = Speedy.Matrix.Eye(3);

        // we want the estimated partial pose [ r1 | r2 | t ] to be as close
        // as possible to the normalized homography, up to a scale factor;
        // i.e., H * [ r1 | r2 | t ]^(-1) = s * I for a non-zero scalar s
        // it won't be a perfect equality due to noise in the homography.
        // remark: composition of homographies
        const residual = Speedy.Matrix(normalizedHomography);
        for(let k = 0; k < POSE_ITERATIONS; k++) {
            // incrementally improve the partial pose
            const rt = this._estimatePartialPose(residual); // rt should converge to the identity matrix
            partialPose.setToSync(rt.times(partialPose));
            residual.setToSync(residual.times(rt.inverse()));
            //console.log("rt",rt.toString());
            //console.log("residual",residual.toString());
        }
        //console.log('-----------');

        // refine the translation vector
        const mat = partialPose.read();
        const r = mat.slice(0, 6);
        const t0 = mat.slice(6, 9);
        const t = this._refineTranslation(normalizedHomography, r, t0);
        const refinedPartialPose = Speedy.Matrix(3, 3, r.concat(t));

        // filter the partial pose
        const filteredPartialPose = this._filterPartialPose(refinedPartialPose);

        // estimate the full pose
        //const finalPartialPose = partialPose;
        const finalPartialPose = filteredPartialPose;
        return this._estimateFullPose(finalPartialPose);
    }
}
