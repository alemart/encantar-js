/*
 * encantar.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022-2026 Alexandre Martins <alemartf(at)gmail.com>
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
import { PoseFilter } from './pose-filter';
import { NumericalError } from '../utils/errors';

/** A guess of the horizontal field-of-view of a typical camera, in degrees */
const HFOV_GUESS = 60; // https://developer.apple.com/library/archive/documentation/DeviceInformation/Reference/iOSDeviceCompatibility/Cameras/Cameras.html

/** The default scale of the image plane. The scale affects the focal length */
const DEFAULT_SCALE = 2; // the length of the [-1,+1] interval

/** Convert degrees to radians */
const DEG2RAD = 0.017453292519943295; // pi / 180

/** Convert radians to degrees */
const RAD2DEG = 57.29577951308232; // 180 / pi

/** Numerical tolerance */
const EPSILON = 1e-6;

/** Index of the horizontal focal length in the camera intrinsics matrix (column-major format) */
const FX = 0;

/** Index of the vertical focal length in the camera intrinsics matrix */
const FY = 4;

/** Index of the horizontal position of the principal point in the camera intrinsics matrix */
const U0 = 6;

/** Index of the vertical position of the principal point in the camera intrinsics matrix */
const V0 = 7;

/** Number of iterations used to refine the estimated pose */
const POSE_REFINEMENT_ITERATIONS = 30;

/** Maximum number of iterations used when refining the translation vector */
const TRANSLATION_REFINEMENT_ITERATIONS = 15;

/** Tolerance used to exit early when refining the translation vector */
const TRANSLATION_REFINEMENT_TOLERANCE = DEFAULT_SCALE * 0.01;

/** Size of the grid used to refine the translation vector */
const TRANSLATION_REFINEMENT_GRIDSIZE = 5; //3;



/**
 * Camera model
 */
export class CameraModel
{
    /** size of the image plane */
    private _imageSize: SpeedySize;

    /** 3x4 camera matrix */
    private _matrix: SpeedyMatrix;

    /** a helper to switch the handedness of a coordinate system */
    private _flipZ: SpeedyMatrix;

    /** entries of the intrinsics matrix in column-major format */
    private _intrinsics: number[];

    /** entries of the extrinsics matrix in column-major format */
    private _extrinsics: number[];

    /** smoothing filter */
    private _filter: PoseFilter;



    /**
     * Constructor
     */
    constructor()
    {
        this._imageSize = Speedy.Size(0, 0);
        this._matrix = Speedy.Matrix.Eye(3, 4);
        this._intrinsics = [1,0,0,0,1,0,0,0,1]; // 3x3 identity matrix
        this._extrinsics = [1,0,0,0,1,0,0,0,1,0,0,0]; // 3x4 matrix [ R | t ] = [ I | 0 ] no rotation & no translation
        this._filter = new PoseFilter();
        this._flipZ = Speedy.Matrix(4, 4, [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0,-1, 0,
            0, 0, 0, 1
        ]);
    }

    /**
     * Initialize the model
     * @param aspectRatio aspect ratio of the image plane
     * @param scale optional scale factor of the image plane
     */
    init(aspectRatio: number, scale: number = DEFAULT_SCALE): void
    {
        // log
        Utils.log(`Initializing the camera model...`);
        Utils.assert(aspectRatio > 0 && scale > 1e-5);

        // set the size of the image plane
        // this rule is conceived so that min(w,h) = s and w/h = a
        if(aspectRatio >= 1) {
            this._imageSize.width = aspectRatio * scale;
            this._imageSize.height = scale;
        }
        else {
            this._imageSize.width = scale;
            this._imageSize.height = scale / aspectRatio;
        }

        // reset the model
        this.reset();
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
     * @param homographyNDC 3x3 perspective transform
     * @returns a promise that resolves to a camera matrix
     */
    update(homographyNDC: SpeedyMatrix): SpeedyPromise<SpeedyMatrix>
    {
        Utils.assert(homographyNDC.rows == 3 && homographyNDC.columns == 3);

        // convert to image space
        const homography = this._convertToImageSpace(homographyNDC);

        // read the entries of the homography
        const h = homography.read();
        const h11 = h[0], h12 = h[3], h13 = h[6],
              h21 = h[1], h22 = h[4], h23 = h[7],
              h31 = h[2], h32 = h[5], h33 = h[8];

        // validate the homography (homography matrices aren't singular)
        const det = h13 * (h21 * h32 - h22 * h31) - h23 * (h11 * h32 - h12 * h31) + h33 * (h11 * h22 - h12 * h21);
        if(Math.abs(det) < EPSILON || Number.isNaN(det))
            return Speedy.Promise.reject(new NumericalError(`Can't update the camera model using an invalid homography matrix`));

        // estimate the pose
        const pose = this._estimatePose(homography);
        if(this._filter.feed(pose))
            this._extrinsics = this._filter.output().read();

        // compute the camera matrix
        const Z = this._flipZ; // switch to a right handed system
        const K = Speedy.Matrix(3, 3, this._intrinsics);
        const E = Speedy.Matrix(3, 4, this._extrinsics);
        this._matrix.setToSync(K.times(E).times(Z));

        /*
        // test
        console.log("homography ------------", homography.toString());
        console.log("intrinsics ------------", K.toString());
        console.log("extrinsics ------------", E.toString());
        console.log("extrinsicsINV ---------", Speedy.Matrix(this.computeViewMatrix().inverse()).toString());
        console.log("matrix ----------------", this._matrix.toString());
        console.log("projectionMatrix ----- ", this.computeProjectionMatrix(0.1,100).toString());
        */

        // done!
        return Speedy.Promise.resolve(this._matrix);
    }

    /**
     * Reset the camera model
     */
    reset(): void
    {
        this._resetIntrinsics();
        this._resetExtrinsics();
    }

    /**
     * The 3x4 camera matrix
     */
    get matrix(): SpeedyMatrix
    {
        return this._matrix;
    }

    /**
     * The size of the image plane
     */
    get imageSize(): SpeedySize
    {
        return this._imageSize;
    }

    /**
     * The aspect ratio of the image
     */
    get aspectRatio(): number
    {
        return this._imageSize.width / this._imageSize.height;
    }

    /**
     * Focal length in "pixels" (projection distance in the pinhole camera model)
     * same as (focal length in mm) * (number of "pixels" per world unit in "pixels"/mm)
     * "pixels" means image plane units
     */
    get focalLength(): number
    {
        return this._intrinsics[FX]; // fx == fy
    }

    /**
     * Horizontal field-of-view, given in radians
     */
    get fovx(): number
    {
        const halfWidth = this._imageSize.width / 2;
        return 2 * Math.atan(halfWidth / this._intrinsics[FX]);
    }

    /**
     * Vertical field-of-view, given in radians
     */
    get fovy(): number
    {
        const halfHeight = this._imageSize.height / 2;
        return 2 * Math.atan(halfHeight / this._intrinsics[FY]);
    }

    /**
     * Camera intrinsics matrix
     * @returns a 3x3 camera intrinsics matrix
     */
    intrinsicsMatrix(): SpeedyMatrix
    {
        return Speedy.Matrix(3, 3, this._intrinsics);
    }

    /**
     * Compute the view matrix. This 4x4 matrix moves 3D points from
     * world space to view space. We want the camera looking in the
     * direction of the negative z-axis (WebGL-friendly)
     * @returns a view matrix
     */
    computeViewMatrix(): SpeedyMatrix
    {
        const E = this._extrinsics;

        // We augment the 3x4 extrinsics matrix E with the [ 0  0  0  1 ] row
        // and get E+. Let Z be 4x4 flipZ, the identity matrix with the third
        // column negated. The following matrix is View = Z * E+ * Z. We get
        // the camera looking in the direction of the negative z-axis in a
        // right handed system!
        return Speedy.Matrix(4, 4, [
            E[0], E[1],-E[2], 0, // r1
            E[3], E[4],-E[5], 0, // r2
           -E[6],-E[7],+E[8], 0, // r3
            E[9], E[10],-E[11], 1 // t
        ]);
    }

    /**
     * Compute a perspective projection matrix for WebGL
     * @param near distance of the near plane
     * @param far distance of the far plane
     */
    computeProjectionMatrix(near: number, far: number): SpeedyMatrix
    {
        const fx = this._intrinsics[FX];
        const fy = this._intrinsics[FY];
        const halfWidth = this._imageSize.width / 2;
        const halfHeight = this._imageSize.height / 2;

        // we assume that the principal point is at the center of the image plane
        const right = near * (halfWidth / fx);
        const top = near * (halfHeight / fy);
        //const top = right * (halfHeight / halfWidth); // same thing
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

    /**
     * Reset camera extrinsics
     */
    private _resetExtrinsics(): void
    {
        // set the rotation matrix to the identity
        this._extrinsics.fill(0);
        this._extrinsics[0] = this._extrinsics[4] = this._extrinsics[8] = 1;

        // reset filter
        this._filter.reset();
    }

    /**
     * Reset camera intrinsics
     */
    private _resetIntrinsics(): void
    {
        const cameraWidth = Math.max(this._imageSize.width, this._imageSize.height); // portrait or landscape?

        const u0 = 0; // principal point at the center of the image plane
        const v0 = 0;
        const fx = (cameraWidth / 2) / Math.tan(DEG2RAD * HFOV_GUESS / 2);
        const fy = fx;

        this._intrinsics[FX] = fx;
        this._intrinsics[FY] = fy;
        this._intrinsics[U0] = u0;
        this._intrinsics[V0] = v0;
    }

    /**
     * Convert a homography from NDC to image space
     * @param homographyNDC
     * @returns a new homography
     */
    private _convertToImageSpace(homographyNDC: SpeedyMatrix): SpeedyMatrix
    {
        const w = this._imageSize.width / 2;
        const h = this._imageSize.height / 2;

        // fromNDC converts points from NDC to image space
        const fromNDC = Speedy.Matrix(3, 3, [
            w, 0, 0,
            0, h, 0,
            0, 0, 1
        ]);

        /*
        // make h33 = 1 (wanted?)
        const data = homographyNDC.read();
        const h33 = data[8];
        const hom = homographyNDC.times(1/h33);
        */

        // convert homography
        return Speedy.Matrix(fromNDC.times(homographyNDC));
    }

    /**
     * Compute a normalized homography H^ = K^(-1) * H for an
     * ideal pinhole with f = 1 and principal point = (0,0)
     * @param homography homography H to be normalized
     * @returns normalized homography H^
     */
    private _normalizeHomography(homography: SpeedyMatrix): SpeedyMatrix
    {
        const u0 = this._intrinsics[U0];
        const v0 = this._intrinsics[V0];
        const fx = this._intrinsics[FX];
        const fy = this._intrinsics[FY];
        const u0fx = u0 / fx;
        const v0fy = v0 / fy;

        const h = homography.read();
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
            return Speedy.Matrix(3, 3, (new Array<number>(9)).fill(Number.NaN));

        // recover the rotation
        let r = new Array<number>(6);
        r[0] = scale * h11;
        r[1] = scale * h21;
        r[2] = scale * h31;
        r[3] = scale * h12;
        r[4] = scale * h22;
        r[5] = scale * h32;

        // refine the rotation (r is initially noisy)
        r = this._refineRotation(r);

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
        let t = new Array<number>(3);
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

        /*
        const Linv = Speedy.Matrix(2, 2, [1/s1, 0, 0, 1/s2]); // L inverse

        // compute the correction matrix C = Q * Linv * Q', where Q = [q1|q2]
        // is orthogonal and Linv is computed as above
        const Q = Speedy.Matrix(2, 2, [x1, y1, x2, y2]);
        const Qt = Speedy.Matrix(2, 2, [x1, x2, y1, y2]);
        const C = Q.times(Linv).times(Qt);

        // correct the rotation vectors r1 and r2 using C
        const R = Speedy.Matrix(3, 2, [r11, r21, r31, r12, r22, r32]);
        return Speedy.Matrix(R.times(C)).read();
        */

        // find C = Q * Linv * Q' manually
        // [ a  b ] is symmetric
        // [ b  c ]
        const a = x1*x1/s1 + x2*x2/s2;
        const b = x1*y1/s1 + x2*y2/s2;
        const c = y1*y1/s1 + y2*y2/s2;

        // find RC manually
        return [
            a*r11 + b*r12,
            a*r21 + b*r22,
            a*r31 + b*r32,

            b*r11 + c*r12,
            b*r21 + c*r22,
            b*r31 + c*r32
        ];
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

        // generate a grid of sample points [ xi  yi ]' in the image
        //const x = [ 0, -1, +1, +1, -1 ];
        //const y = [ 0, -1, -1, +1, +1 ];
        const g = TRANSLATION_REFINEMENT_GRIDSIZE;
        const x = new Array<number>(g*g);
        const y = new Array<number>(g*g);
        const halfWidth = this._imageSize.width / 2;
        const halfHeight = this._imageSize.height / 2;

        for(let k = 0, i = 0; i < g; i++) {
            for(let j = 0; j < g; j++, k++) {
                // in [-1,+1]
                x[k] = (i/(g-1)) * 2 - 1;
                y[k] = (j/(g-1)) * 2 - 1;

                // in [-s/2,+s/2], where s = w,h
                x[k] *= halfWidth;
                y[k] *= halfHeight;
            }
        }
        //console.log(x.toString(), y.toString());

        // set auxiliary values: ai = H [ xi  yi  1 ]'
        const n = x.length;
        const a1 = new Array<number>(n);
        const a2 = new Array<number>(n);
        const a3 = new Array<number>(n);
        for(let i = 0; i < n; i++) {
            a1[i] = x[i] * h11 + y[i] * h12 + h13;
            a2[i] = x[i] * h21 + y[i] * h22 + h23;
            a3[i] = x[i] * h31 + y[i] * h32 + h33;
        }

        // we'll solve M t = v for t with linear least squares
        // M: 3n x 3, v: 3n x 1, t: 3 x 1
        const n3 = 3*n;
        const m = new Array<number>(n3 * 3);
        const v = new Array<number>(n3);
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
        const r = new Array<number>(3*n);
        const c = new Array<number>(3);
        const Mc = new Array<number>(3*n);

        // initial guess
        const t = new Array<number>(3);
        t[0] = t0[0];
        t[1] = t0[1];
        t[2] = t0[2];

        // iterate
        for(let it = 0; it < TRANSLATION_REFINEMENT_ITERATIONS; it++) {
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
            //console.log("c'c=",num," at #",it+1);
            if(num < TRANSLATION_REFINEMENT_TOLERANCE)
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
     * Find a 3x3 rotation matrix R given two orthonormal vectors [ r1 | r2 ]
     * @param partialRotation partial rotation matrix [ r1 | r2 ] in column-major format
     * @returns a rotation matrix R in column-major format
     */
    private _computeFullRotation(partialRotation: number[]): number[]
    {
        const r11 = partialRotation[0], r12 = partialRotation[3];
        const r21 = partialRotation[1], r22 = partialRotation[4];
        const r31 = partialRotation[2], r32 = partialRotation[5];

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
        return [
            r11, r21, r31,
            r12, r22, r32,
            r13, r23, r33
        ];
    }

    /**
     * Estimate the pose [ R | t ] given a homography in sensor space
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
        for(let k = 0; k < POSE_REFINEMENT_ITERATIONS; k++) {
            // incrementally improve the partial pose
            const rt = this._estimatePartialPose(residual); // rt should converge to the identity matrix
            partialPose.setToSync(rt.times(partialPose));
            residual.setToSync(residual.times(rt.inverse()));
            //console.log("rt",rt.toString());
            //console.log("residual",residual.toString());
        }
        //console.log('-----------');

        // read the partial pose
        const mat = partialPose.read();
        const r0 = mat.slice(0, 6);
        const t0 = mat.slice(6, 9);

        // refine the translation vector and compute the full rotation matrix
        const t = this._refineTranslation(normalizedHomography, r0, t0);
        const r = this._computeFullRotation(r0);

        // done!
        return Speedy.Matrix(3, 4, r.concat(t));
    }
}
