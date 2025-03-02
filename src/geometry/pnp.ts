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
 * pnp.ts
 * Perspective-N-Point for Planar Tracking
 */

/*

My Approach to Perspective-N-Point for Planar Tracking
------------------------------------------------------
                                            by alemart
                                          Jan-Feb 2025

Problem statement: we are given two images, A and B, of a planar target T, as well
as a pinhole camera and correspondences between points of the images. On image A,
the target is parallel to the image plane of the camera. On image B, the target is
viewed in some way. We're looking for a rigid transform [ R | t ] of T, in 3D space,
that is consistent with the observations of the camera (from image A to B). In my
formulation, the target moves and the camera stays fixed. The camera intrinsics K
are known.

Design goals: I'm looking for an algorithm that is both fast and simple. Of course,
"simple" is a relative term. What I mean is that I can easily implement it by hand
here, without requiring external dependencies such as numerical packages, and
without needing to implement long or overly complicated routines myself. By fast,
I mean that it's suitable for AR, preferably an analytical solution (closed formula).



1. Definitions
--------------

View space: a 3D space centered at the optical center O of the camera

Model space: a 3D space centered at some pivot point of the planar target T

Image space: a 2D space induced by the image plane of the camera and centered at
its principal point



2. Problem formulation
----------------------

We are given two sets of n >= 4 points in image space: P = { p1, ..., pn } and
Q = { q1, ..., qn }. Points pi belong to image A. Points qi, to image B. The pair
(pj, qj) represents a known correspondence between points of these images. Even
though these are 2D points represented by 2x1 vectors, when appropriate I will
use the same notation to represent these points as homogeneous 3x1 vectors.

Let's consider image A for a moment. The planar target T is, by design, parallel
to the image plane of the camera. As a convention, I'll say that all points of the
planar target, in view space, are located at the plane Z = z0 for some constant
z0 > f (f: focal length of the camera). We can recover the 3D coordinates of all
points in P by unprojecting them. Let Kinv be the inverse of the 3x3 intrinsics
matrix K. For all i, let's define point ui as:

ui = z0 * Kinv * pi

(pi in homogeneous coordinates)

In a nutshell, ui is just pi in view space. Example: if K = diag(f, f, 1), then
ui = [ z0 * pix / f    z0 * piy / f    z0 ]'. This result is trivially found
using similar triangles.


                            | ui
            | pi            |
  .---------|---------------|--------------------> Z-axis
  O         |               |
                            |
         image            planar
         plane            target
         Z = f            Z = z0

Now let's consider image B. We do not know the pose of the planar target T at
this time, and so we do not know (beforehand) the distances between the points
of T and the optical center O. We'll figure out these distances later. For now,
it's enough to say that, for each point qi of Q, we can recover a line in view
space passing through O (origin) and qi. For all i, let's define unit vector vi:

        Kinv * qi
vi = ---------------
     || Kinv * qi ||

(qi in homogeneous coordinates)

In summary, we're unprojecting the qi's to recover the lines of sight.

We want (R,t), a rigid transform of T that is consistent with the observations of
the camera (from image A to B). R is a 3x3 rotation matrix. t is a 3x1 translation
vector. Notice that if we apply that transform to the ui's, the 3D points of image
A, we'll get points somewhere along the vi's, the lines of sight of image B:

R * ui + t = si * vi

for some constant si > 0 (points are in front of the camera).

In the presence of noise, this won't be an equality. Write ri = R * ui + t - si * vi,
where ri is a residual vector. This inspires us to write the following cost function:

~E(R,t) = sum_i of ||ri||^2 = sum_i of ri'ri

the si's are unknown at this moment.



3. Separating translation and rotation
--------------------------------------

We'll find the rotation and the translation separately. By computing the derivative
of ~E(R,t) w.r.t t and setting it to zero, we find the optimal translation vector:

0 = 2 * n * t + 2 * sum_i of ( R * ui - si vi ), meaning that

t = [ (1/n) * sum_i of (si * vi) ] - R * ^u

where ^u is the centroid of the ui's, i.e.,

^u = (1/n) sum_i of ui

So far so good. For all i, let's define point #ui as:

#ui = ui - ^u

Points { #ui } define a space centered at ^u. We'll use them to write a minimization
problem for the rotation alone.

I have just shown that, for all j, sj * vj = R * uj + t for some constant sj > 0 when
ignoring the noise. Substituting t by the optimal translation vector, we get

sj * vj =
R * uj + t =
R * uj + [ (1/n) * sum_i of (si * vi) ] - R ^u =
R * (uj - ^u) + [ (1/n) * sum_i of (si * vi) ] =
R * #uj + [ (1/n) * sum_i of (si * vi) ]

Therefore, we find that R * #uj = sj * vj - [ (1/n) * sum_i of (si * vi) ] or,
equivalently, that

R * #uj = s0 * [ (sj/s0) * vj - (1/n) * sum_i of ( (si/s0) * vi ) ]

where s0 is some element of { sk | k = 1, 2, ..., n }. Note that s0 > 0 by design.

For simplicity, let's define, for all j, unit vector #vj as follows:

         (sj/s0) * vj - (1/n) sum_i of ( (si/s0) * vi )
#vj = ----------------------------------------------------
      || (sj/s0) * vj - (1/n) sum_i of ( (si/s0) * vi ) ||

We may then rewrite the above equation to

R * #uj = c * #vj

where c is the constant s0 * || (sj/s0) * vj - (1/n) sum_i of ( (si/s0) * vi ) ||

So far so good! Now, the projection of R * #uj onto unit vector #vj is given by
#vj * ( #vj' R*#uj ) = (#vj * #vj') * R*#uj. We'll use this result to define the
following difference for all j:

Dj = R * #uj - projection of (R * #uj) onto #vj
Dj = R * #uj - (#vj * #vj') * R * #uj
Dj = (I - #vj * #vj') * (R * #uj)

The intent here is to minimize the distance between the rotated points and the
lines of sight. This inspires us to write the following cost function:

^E = sum_j of ||Dj||^2 = sum_j of Dj'Dj

We'll find R by minimizing ^E. We have successfully separated the problem of
finding the rigid transform into two: first, we'll find the rotation. Later,
we'll find the translation. Note that the ratios sj/s0 are unknown at this point.
They represent a relative distance between the points. We need them before we can
minimize ^E.



4. Model space magic
--------------------

Our goal now is to find the ratios sj/s0 for all j. We'll start by selecting a
pivot point u0 in { u1, ..., un } of the planar target. u0 is the origin of the
model space.

Any point ut can be converted from view space to model space by writing ut - u0.
Pick two non-pivot points, ui and uj. It turns out that < u0, { ui-u0, uj-u0 } >
forms a basis in model space (if the points are colinear, we exit with an error).
This means that any point uk-u0 in model space can be expressed as a linear
combination of ui-u0 and uj-u0:

uk-u0 = ai * (ui-u0) + aj * (uj-u0)

All ut's are at Z = z0 by design. Consequently, this is a system of 2 linear
equations and 2 unknowns. We can trivially solve it for ai and aj.

They key insight here is that, no matter what the rigid transform (R,t) is,
points in model space are not affected by it. Another way of saying this is:
ai and aj are unaffected by the rigid transform! This is the magic that lets
us write:

R * (uk-u0) = R * (ai * (ui-u0) + aj * (uj-u0))
R*uk - R*u0 = ai * (R*ui - R*u0) + aj * (R*uj - R*u0)
R*uk - R*u0 + t - t = ai * (R*ui - R*u0 + t - t) + aj * (R*uj - R*u0 + t - t)
(R*uk+t) - (R*u0+t) = ai * ((R*ui+t) - (R*u0+t)) + aj * ((R*uj+t) - (R*u0+t))
sk vk - s0 v0 = ai * (si vi - s0 v0) + aj * (sj vj - s0 v0)

Now, we divide this equation by s0 and regroup:

(ai + aj - 1) v0 = (si/s0) ai vi + (sj/s0) aj vj - (sk/s0) vk

This is a system of 3 linear equations and 3 unknowns: si/s0, sj/s0 and sk/s0.
We can trivially solve it.

Okay, we have found 3 ratios. However, we need all ratios. We can repeat this
procedure with other points, but let's investigate a different way as a curiosity.

(((
    
By the way...

We can compute s0 by noticing that the squared distance ||ui-u0||^2 is known:

||ui-u0||^2 = (*)
||si vi - s0 v0||^2 =
(si vi - s0 v0)'(si vi - s0 v0) =
si^2 - 2 si s0 vi'v0 + s0^2 =
s0^2 * ((si/s0)^2 - 2 vi'v0 (si/s0) + 1)

Therefore, s0 = sqrt( ||ui-u0||^2 / ((si/s0)^2 - 2 vi'v0 (si/s0) + 1) ). Now
we can recover si, sj and sk.

(*) note that a rigid transform preserves distances: ||(Rp + t) - (Rq + t)||^2 =
||Rp - Rq||^2 = ||R(p-q)||^2 = [R(p-q)]'[R(p-q)] = (p-q)'R'R(p-q) = (p-q)'I(p-q) =
(p-q)'(p-q) = ||p-q||^2.

)))



5. Normal vector
----------------

Suppose that all points of the planar target in view space are perfectly noiseless,
and that they all belong to the plane ax + by + cz + d = 0. N = [a b c]' is a normal
vector to the plane and d is an offset value. If (sj vj) and (s0 v0) belong to the
plane, then it follows that N'(sj vj) = N'(s0 v0) = -d. Therefore, we have the ratio:

 sj     N'v0
---- = ------
 s0     N'vj

If we have a normal vector, we can quickly compute any ratio. A normal vector can be
computed by taking the cross product between any non-parallel vectors in model space,
say, (si vi - s0 v0) and (sj vj - s0 v0). Let's call that ^N:

^N = (si vi - s0 v0) x (sj vj - s0 v0) =
[ s0 ((si/s0) vi - v0) ] x [ s0 ((sj/s0) vj - v0) ] =
s0^2 * [ ((si/s0) vi - v0) x ((sj/s0) vj - v0 ) ] =
s0^2 * #N

where #N = ((si/s0) vi - v0) x ((sj/s0) vj - v0)

Note that ^N and #N are parallel. Since we know si/s0 and sj/s0 from the previous
step, we can just compute #N and normalize it as a convenience. That's our normal
vector:

       #N
N = --------
    || #N ||

Now we can quickly find any ratio.

Question: when does N'vj = 0 ? When N'(sj vj) = 0 = d. In other words, the plane
passes through the origin of view space (optical center). That's a degenerate case!
It doesn't happen in practice: we can't detect points that way.

Here we need a word of caution. In practice, points have noise. If the normal vector
is noisy, then the ratios will be noisy, which means that the entire estimated pose
will be noisy. This can be remedied with a RANSAC scheme, but it's not really robust.



6. Finding the rotation
-----------------------

Recall that we wish to find the rotation matrix R by minimizing the cost function ^E:

^E = sum_j of ||Dj||^2 = sum_j of Dj'Dj

where Dj = (I - #vj * #vj') * (R * #uj)

Since we know all ratios sj/s0, we can compute all #vj's. Cool! Now let's expand ^E:

^E = sum_j of [ (R * #uj)' * (I - #vj * #vj')' (I - #vj * #vj') * (R * #uj) ] =
sum_j of [ (R * #uj)' * (I - #vj * #vj') * (R * #uj) ] = ... =
sum_j of [ #uj' * #uj - ( #vj' * R * #uj )^2 ]

Minimizing ^E is equivalent to maximizing G = sum_j of ( #vj' * R * #uj )^2. Clearly,
G is maximized when all #vj and R * #uj are parallel (dot product => cosine = +-1).
If R* maximizes G, then so does -R*. It turns out that we're only interested in one
rotation: the one that maximizes the dot product #vj' * ( R * #uj ). That's because
the planar target is expected to be in front of the image plane. So, let's rewrite
the rotation problem as:

find R such that the scalar G(R) = sum_j of ( #vj' * R * #uj ) is maximized.

We could write R in terms of a unit quaternion and solve this problem numerically.
However, let's explore a different approach that is faster (and elegant!)



7. Quaternions
--------------

In this section, we explore an elegant derivation inspired by the paper: "Closed-form
solution of absolute orientation using unit quaternions" (B.K.P. Horn). There is a
lecture on YouTube about this subject by the author: https://youtu.be/kigLhcTm_gg
Even though I'm using a different convention for quaternions when compared to the
paper, the spirit of the idea is the same. The specific matrices change a bit. We're
relating points to rays rather than points to points as in the paper, but that's ok.

The key insight in the derivation that follows is that quaternion multiplication can
be expressed as matrix multiplication (see quaternion.ts for details). Here I'll be
using the same notation to express quaternions and 3D vectors; the appropriate object
can be inferred by the context. A 3D vector can be expressed as a pure quaternion,
i.e., a quaternion (x,y,z,w) whose real part is zero (w = 0).

Let's take the scalar Gj = #vj' * R * #uj. If q is a unit quaternion representing R,
then this same scalar can be rewritten as #vj' * ( q * #uj * q* ), where q* denotes
the conjugate of q. From quaternion.ts, we can rewrite this again as a multiplication
of matrices: Gj = #vj' * ( Qr' * Ql * #uj ), where

     [  w  -z   y   x  ]           [  w  -z   y  -x  ]
Ql = [  z   w  -x   y  ] and Qr' = [  z   w  -x  -y  ]
     [ -y   x   w   z  ]           [ -y   x   w  -z  ]
     [ -x  -y  -z   w  ]           [  x   y   z   w  ]

Since matrix multiplication is associative, we have Gj = (#vj' * Qr') * (Ql * #uj),
or equivalently, Gj = (Qr * #vj)' * (Ql * #uj) = (#vj * q)' * (q * #uj). Since both
#uj and #vj are viewed as quaternions, we can convert this quaternion multiplication
to matrix multiplication: Gj = (#Vjl * q)' * (#Ujr * q) = q' * ( #Vjl' * #Ujr ) * q.
Here, q is a 4x1 column vector and ( #Vjl' * #Ujr ) is a known 4x4 matrix. The cost
function G is just the sum_j of Gj. Therefore, the problem can be rewritten as:

find a unit quaternion q such that G(q) = q' * M * q is maximized,

where M = sum_j of ( #Vjl' * #Ujr ).

What an elegant formulation!

After a few algebraic manipulations, we find M to be a symmetric matrix of this form:

    [ xx-yy   xy+yx  zx      zy    ]
M = [ xy+yx  -xx+yy  zy     -zx    ]
    [ zx      zy    -xx-yy  -xy+yx ]
    [ zy     -zx    -xy+yx   xx+yy ]

where

xx = sum_j of #vj.x * #uj.x
xy = sum_j of #vj.x * #uj.y
yx = sum_j of #vj.y * #uj.x
...
and so on.

Note that #uj.z = 0 for all j because uj.z = z0 for all j. This result is not
exactly the same as that of the paper; it's a simpler one, because we're only
concerned with a planar target.

Okay, all good! Now fasten your seatbelts! Get ready for the icing of the cake!



8. Eigenvalues
--------------

Let A be a symmetric matrix and x be a compatible column-vector. Suppose we wish to
maximize the scalar f(x) = x'Ax subject to the constraint ||x||^2 = x'x = 1. We can
employ the method of Lagrange multipliers. The Lagrangian of f is given by:

L(x,t) = x'Ax - t(x'x - 1), where t is the Lagrange multiplier.

Let's take the derivative of L with respect to x and set it to zero:

dL/dx = (A + A')x - t(2 x) = 2 A x - 2 t x = 2(Ax - tx) = 0

In other words, Ax = tx. This is an eigenvalue problem!

If we wish to maximize f, we pick an eigenvector corresponding to the largest
eigenvalue of A. If we wish to minimize f, we pick an eigenvector corresponding
to the smallest eigenvalue of A.

So, going back to the problem finding a rotation, we'll follow this recipe:

a) find the largest eigenvalue of M
b) find a corresponding eigenvector
c) normalize the eigenvector to get a unit quaternion
d) convert the unit quaternion to a rotation matrix

AND WE'RE DONE!

WOW!!!!!!!!!!!!

Now check this out: M is a 4x4 matrix of a particular form. We can compute its
characteristic polynomial to find its eigenvalues: we'll see a quartic equation.
I'll spare the reader (and myself) of the long algebraic details, but it turns
out that this quartic equation is actually a biquadratic equation (!!!!!!!!!!!)
that is readily and easily solvable! Sweet!

Once we compute the rotation matrix R, we can recover the translation vector t
as I explained earlier. Now we've found (R,t) with a quick analytic solution!

*/

import Speedy from 'speedy-vision';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { Utils, Nullable } from '../utils/utils';
import { IllegalArgumentError } from '../utils/errors';



/** A guess of the width of the imaging sensor */
const DEFAULT_SENSOR_WIDTH_IN_METERS = 5 * 0.001; // 5 mm

/** A guess of the width of the planar target */
const DEFAULT_TARGET_WIDTH_IN_METERS = 20 * 0.01; // 20 cm

/** Whether or not to use a normal vector to find the relative distances between the points */
const USE_NORMAL_VECTOR = false;

/** Small number */
const EPSILON = 1e-8;

/** Debug flag */
const DEBUG = false;



/** "Static" variables used by the mathematical method
    (this is to avoid too many memory allocations) */

/** Tiny Matrix type */
type TinyMatrix = Float64Array & { _rows: number, _cols: number };

/** Maximum number of data points */
const MAX_POINTS = 1024;

// solvePlanarPnP
const INVALID_POSE = Speedy.Matrix(3, 4, new Array<number>(12).fill(Number.NaN));
const Kinv = mat3(0);
const p = Array.from({ length: MAX_POINTS }, () => vec3(0));
const q = Array.from({ length: MAX_POINTS }, () => vec3(0));
const u = Array.from({ length: MAX_POINTS }, () => vec3(0));
const v = Array.from({ length: MAX_POINTS }, () => vec3(0));
const uc = Array.from({ length: MAX_POINTS }, () => vec3(0));
const vc = Array.from({ length: MAX_POINTS }, () => vec3(0));
const sjs0 = new Array<number>(MAX_POINTS).fill(0);
const uhat = vec3(0), vhat = vec3(0), vstar = vec3(0);
const A = mat3(0), invA = mat3(0), b = vec3(0), eigenvec = vec3(0);
const R = mat3(0), quaternion = vec4(0), Ruhat = vec3(0);
const centroid = vec3(0), t = vec3(0);
const pose = new Array<number>(12).fill(0);

// findNormalVector, findRatios
const wi = vec3(0), wj = vec3(0), wk = vec3(0);
const _b = vec3(0), _A = mat3(0), _invA = mat3(0), _x = vec3(0);
const ri = vec3(0), rj = vec3(0), nvec = vec3(0);

// buildHomography, computeReprojectionError
const H = mat3(0), invH = mat3(0);
const M = mat3x4(0), rt = mat3(0), A4 = mat4(0);




/** Options for the RANSAC scheme */
export interface solvePlanarPnPRansacOptions
{
    /** maximum number of models to be generated */
    numberOfHypotheses?: number;

    /** reprojection error threshold for a point to be considered an outlier */
    reprojectionError?: number;

    /** a value used to exit early if a good percentage of inliers is found */
    acceptablePercentageOfInliers?: number;

    /** output mask of inliers */
    mask?: Nullable<SpeedyMatrix>;
}

/** Options for find6DoFHomography() */
export interface find6DoFHomographyOptions extends solvePlanarPnPRansacOptions
{
    /** quality of the refinement: a value in [0,1] */
    refinementQuality?: number;
}

/** Default options for the RANSAC scheme */
const DEFAULT_RANSAC_OPTIONS: Required<solvePlanarPnPRansacOptions> = {
    numberOfHypotheses: 100,
    reprojectionError: 3,
    acceptablePercentageOfInliers: Number.POSITIVE_INFINITY, // never exit early
    mask: null,
};

/** Default options for find6DoFHomography() */
const DEFAULT_FIND6DOFHOMOGRAPHY_OPTIONS: Required<find6DoFHomographyOptions> = Object.assign(
    {}, DEFAULT_RANSAC_OPTIONS, {
        refinementQuality: 1.0
    }
);




/**
 * Perspective-N-Point for planar tracking. Requires n >= 4 points.
 * @param referencePoints 2 x n matrix with reference points in a plane parallel to the image plane (Z = z0 > 0)
 * @param observedPoints 2 x n matrix with the observed points corresponding to the reference points
 * @param cameraIntrinsics 3x3 matrix
 * @returns 3x4 [ R | t ] matrix describing the pose of the planar target in view space, or a matrix of NaNs if no pose is found
 */
export function solvePlanarPnP(referencePoints: SpeedyMatrix, observedPoints: SpeedyMatrix, cameraIntrinsics: SpeedyMatrix): SpeedyMatrix
{
    // sanity check
    if(referencePoints.rows != 2 || observedPoints.rows != 2 || referencePoints.columns != observedPoints.columns)
        throw new IllegalArgumentError('Bad input');
    else if(cameraIntrinsics.rows != 3 || cameraIntrinsics.columns != 3)
        throw new IllegalArgumentError('Bad intrinsics');

    // we require at least 4 points
    let n = referencePoints.columns;
    if(n < 4)
        throw new IllegalArgumentError('solvePlanarPnP requires at least 4 points');
    else if(n > MAX_POINTS)
        n = MAX_POINTS;

    // invert the intrinsics matrix
    const K = cameraIntrinsics.read();
    const fx = K[0], fy = K[4], cx = K[6], cy = K[7];
    Kinv[0] = 1/fx;
    Kinv[4] = 1/fy;
    Kinv[6] = -cx/fx;
    Kinv[7] = -cy/fy;
    Kinv[8] = 1;

    // reference points belong to the target plane,
    // which is parallel to the image plane located at Z = f
    const z0 = getZ0(fx);

    // convert input to homogeneous coordinates
    const P = referencePoints.read(), Q = observedPoints.read();
    for(let i = 0, j = 0; i < n; i++, j += 2) {
        const pi = p[i], qi = q[i];

        pi[0] = P[j];
        pi[1] = P[j+1];
        pi[2] = 1;

        qi[0] = Q[j];
        qi[1] = Q[j+1];
        qi[2] = 1;
    }

    // unproject pi's to get ui's, coplanar points at Z = z0
    for(let i = 0; i < n; i++) {
        mul(u[i], Kinv, p[i]);
        scale(u[i], u[i], z0);
    }

    // unproject qi's and normalize to get the lines of sight
    for(let i = 0; i < n; i++) {
        mul(v[i], Kinv, q[i]);
        normalize(v[i], v[i]);        
    }

    // find u^, the centroid of ui's
    uhat[0] = uhat[1] = uhat[2] = 0;
    for(let i = 0; i < n; i++) {
        const ui = u[i];
        uhat[0] += ui[0];
        uhat[1] += ui[1];
        uhat[2] += ui[2];
    }
    uhat[0] /= n;
    uhat[1] /= n;
    uhat[2] /= n;

    // find uc's
    for(let i = 0; i < n; i++)
        sub(uc[i], u[i], uhat);

    // find the relative distances between the points
    if(USE_NORMAL_VECTOR) {

        // find a normal vector to the plane in view space
        const normal = findNormalVector(u, v, n);
        if(Number.isNaN(normal[0]))
            return INVALID_POSE;

        // find the ratios sj/s0 for all j
        const nv0 = dot(normal, v[0]);
        for(let j = 0; j < n; j++)
            sjs0[j] = nv0 / dot(normal, v[j]);

    }
    else {

        // find the ratios sj/s0 for all j
        sjs0[0] = 1;
        for(let k = 3; k < n; k += 3) {
            const o = 0, i = k-2, j = k-1;
            const ratios = findRatios(u, v, n, o, i, j, k);

            if(Number.isNaN(ratios[0]))
                return INVALID_POSE;

            sjs0[i] = ratios[0];
            sjs0[j] = ratios[1];
            sjs0[k] = ratios[2];

            if(k+3 >= n)
                k -= 2; // change the increment of k to +1
        }

    }

    /*
    DEBUG && print({
        sjs0: sjs0.slice(0, n).join(',')
    });
    */

    // find v^, the centroid (up to a scale) of the transformed points
    vhat[0] = vhat[1] = vhat[2] = 0;
    for(let i = 0; i < n; i++) {
        const vi = v[i];
        const sis0 = sjs0[i];

        vhat[0] += sis0 * vi[0];
        vhat[1] += sis0 * vi[1];
        vhat[2] += sis0 * vi[2];
    }
    vhat[0] /= n;
    vhat[1] /= n;
    vhat[2] /= n;

    // find vc's
    for(let j = 0; j < n; j++) {
        scale(vstar, v[j], sjs0[j]);
        sub(vstar, vstar, vhat);
        normalize(vc[j], vstar);
    }

    /*
    DEBUG && print({
        helpers: {
            v0: v[0],
            nv0,
            sjs0,
            uhat,
            vhat,
            uc,
            vc,
        }
    });
    */

    // compute the factors of M
    let xx = 0, yy = 0, xy = 0, yx = 0, zx = 0, zy = 0;
    for(let j = 0; j < n; j++) {
        const ucj = uc[j];
        const vcj = vc[j];

        xx += vcj[0] * ucj[0];
        yy += vcj[1] * ucj[1];
        xy += vcj[0] * ucj[1];
        yx += vcj[1] * ucj[0];
        zx += vcj[2] * ucj[0];
        zy += vcj[2] * ucj[1];
    }

    /*
    DEBUG && print({
        M: mat4([
            xx-yy, xy+yx, zx, zy,
            xy+yx, -xx+yy, zy, -zx,
            zx, zy, -xx-yy, -xy+yx,
            zy, -zx, -xy+yx, xx+yy,
        ]),
    });
    */

    // find the largest eigenvalue of M
    const xx2 = xx*xx, yy2 = yy*yy, xy2 = xy*xy, yx2 = yx*yx, zx2 = zx*zx, zy2 = zy*zy;
    const delta = xx2 * (yy2 + zy2) + xy2 * (yx2 + zx2) + yx2*zy2 + yy2*zx2 - 2 * (xx*xy * (yx*yy + zx*zy) + yx*yy*zx*zy);
    const eigenval = Math.sqrt(xx2 + xy2 + yx2 + yy2 + zx2 + zy2 + 2 * Math.sqrt(delta));

    // find an eigenvector corresponding to the largest eigenvalue of M
    // (we arbitrarily set its last entry to 1; if there is no rotation, then we expect its other entries to be 0)
    A[0] = xx-yy-eigenval;
    A[1] = xy+yx;
    A[2] = zx;
    A[3] = xy+yx;
    A[4] = -xx+yy-eigenval;
    A[5] = zy;
    A[6] = zx;
    A[7] = zy;
    A[8] = -(xx+yy+eigenval);

    b[0] = -zy;
    b[1] = zx;
    b[2] = xy-yx;

    /*
    DEBUG && print({
        eigen: {
            eigenval,
            A, detA: determinant(A),
            b
        }
    });
    */

    mul(eigenvec, inverse(invA, A), b); // solve Ax = b
    if(Number.isNaN(eigenvec[0]))
        return INVALID_POSE;

    // build a unit quaternion
    const qx = eigenvec[0], qy = eigenvec[1], qz = eigenvec[2], qw = 1;
    const qlen = Math.sqrt(qx*qx + qy*qy + qz*qz + qw*qw);
    quaternion[0] = qx / qlen;
    quaternion[1] = qy / qlen;
    quaternion[2] = qz / qlen;
    quaternion[3] = qw / qlen;

    /*
    DEBUG && print({
        rotation: {
            eigenval,
            eigenvec,
            quaternion
        }
    });
    */

    // find s0, the distance between the pivot and the optical center
    const h = findFarthestPointIndex(u, n, 0);
    const shs0 = sjs0[h];
    const vhv0 = dot(v[h], v[0]);
    const lh0 = distance2(u[h], u[0]);
    const s02 = lh0 / (shs0 * (shs0 - 2 * vhv0) + 1);
    const s0 = Math.sqrt(s02);

    /*
    // find s0, the distance between the pivot and the optical center
    const s02guess = new Array<number>(n-1);
    for(let h = 1; h < n; h++) {
        const shs0 = sjs0[h];
        const vhv0 = dot(v[h], v[0]);
        const lh0 = distance2(u[h], u[0]);
        const s02 = lh0 / (shs0 * (shs0 - 2 * vhv0) + 1);
        s02guess[h-1] = s02;
    }
    s02guess.sort((a,b) => a-b);
    const s02 = s02guess[(n-1) >>> 1]; // median
    const s0 = Math.sqrt(s02);
    */

    /*
    DEBUG && print({
        distance: {
            s0, s02
        }
    });
    */

    // compute the rotation matrix R
    quat2mat(R, quaternion);

    // compute the translation vector t (up to a scale)
    scale(centroid, vhat, s0);
    sub(t, centroid, mul(Ruhat, R, uhat));

    // build the pose [ R | t ]
    for(let i = 0; i < 9; i++)
        pose[i] = R[i];
    for(let i = 0; i < 3; i++)
        pose[9+i] = t[i];

    /*
    DEBUG && print({
        pose: mat3x4(pose)
    });
    */

    // done!
    return Speedy.Matrix(3, 4, pose);
}

/**
 * Perspective-N-Point for planar tracking with RANSAC. Requires n >= 4 points.
 * @param referencePoints 2 x n matrix with reference points in a plane parallel to the image plane (Z = z0 > 0)
 * @param observedPoints 2 x n matrix with the observed points corresponding to the reference points
 * @param cameraIntrinsics 3x3 matrix
 * @param options RANSAC options
 * @returns 3x4 [ R | t ] matrix describing the pose of the planar target in view space, or a matrix of NaNs if no pose is found
 */
export function solvePlanarPnPRansac(referencePoints: SpeedyMatrix, observedPoints: SpeedyMatrix, cameraIntrinsics: SpeedyMatrix, options: solvePlanarPnPRansacOptions = {}): SpeedyMatrix
{
    const settings = Object.assign({}, DEFAULT_RANSAC_OPTIONS, options);
    const numberOfHypotheses = settings.numberOfHypotheses;
    const threshold = settings.reprojectionError;
    const acceptablePercentageOfInliers = settings.acceptablePercentageOfInliers;
    const outputMask = settings.mask;

    const n = referencePoints.columns;
    if(n < 4)
        throw new IllegalArgumentError('solvePlanarPnP requires at least 4 points');

    const mask = new Array<number>(n);
    mask.fill(0);

    const referencePointsEntries = referencePoints.read();
    const observedPointsEntries = observedPoints.read();
    const inliers = new Array<number>(n);
    const permutation = Utils.range(n); // vector of indices

    //const p = new Array<number>(2*n), q = new Array<number>(2*n);
    //let mp = Speedy.Matrix.Zeros(2, n), mq = Speedy.Matrix.Zeros(2, n);
    const p = new Array<number>(2*4), q = new Array<number>(2*4);
    let mp = Speedy.Matrix.Zeros(2, 4), mq = Speedy.Matrix.Zeros(2, 4);
    const reorderPoints = (permutation: number[], n: number) => {
        // resize the matrices to change the number of points
        //p.length = q.length = 2*n;
        //Utils.assert(n == 4);

        // reorder elements according to the permutation
        for(let j = 0; j < n; j++) {
            const k = permutation[j];
            for(let a = 0; a < 2; a++) {
                p[j*2 + a] = referencePointsEntries[k*2 + a];
                q[j*2 + a] = observedPointsEntries[k*2 + a];
            }
        }

        // entries are changed and matrices may be resized
        //mp = Speedy.Matrix(2, n, p);
        //mq = Speedy.Matrix(2, n, q);

        // matrices may NOT be resized
        mp.data.set(p);
        mq.data.set(q);
    };

    let bestError = Number.POSITIVE_INFINITY;
    let bestPose = INVALID_POSE;

    for(let i = 0; i < numberOfHypotheses; i++) {

        // Preprocessing
        // Set p = shuffled referencePoints and q = shuffled observedPoints
        Utils.shuffle(permutation);
        reorderPoints(permutation, 4);

        // Generate a model with 4 points only
        const pose = solvePlanarPnP(mp, mq, cameraIntrinsics);
        const homography = buildHomography(cameraIntrinsics, pose);

        // Evaluate the model against the entire dataset
        //reorderPoints(permutation, n);
        //const error = computeReprojectionError(homography, p, q, threshold, mask);
        const error = computeReprojectionError(homography, referencePointsEntries, observedPointsEntries, threshold, mask);

        /*
        DEBUG && print({
            ransac: {
                iteration: i+1,
                pose: mat3x4(pose.read()),
                error,
                homography,
            }
        });
        */

        // Count and collect the inliers
        let count = 0;
        for(let j = 0; j < n; j++) {
            if(mask[j] != 0)
                inliers[count++] = permutation[j];
                //inliers[count++] = j;
        }

        /*
        DEBUG && print({
            ransac: {
                iteration: i+1,
                inliers: count,
                percentageOfInliers: 100 * count / n
            }
        });
        */

        /*
        // Insufficient inliers? Discard the model
        if(count < 4)
            continue;

        // Generate a new model with all the inliers
        reorderPoints(inliers, count);
        const newPose = solvePlanarPnP(mp, mq, cameraIntrinsics);
        const newHomography = buildHomography(cameraIntrinsics, newPose);

        // Evaluate the new model against the set of inliers
        const newError = computeReprojectionError(newHomography, p, q, threshold, mask);
        */

        // If we generate a new model with all the inliers, we may end up with
        // a bad normal vector, which would adversely affect the entire pose.
        // We're just using n = 4. We'll refine the homography later.
        const newPose = pose;
        const newError = error;

        // Not the best model? Discard it
        if(newError > bestError)
            continue;

        // This is the best model so far!
        bestError = newError;
        bestPose = newPose;

        /*
        const newHomography = homography;
        DEBUG && print({
            ransac: {
                iteration: i+1,
                bestPose: mat3x4(bestPose.read()),
                bestError,
                newHomography,
            }
        });
        */

        // Exit early?
        if(count / n >= acceptablePercentageOfInliers)
            break;

    }

    // set the output mask of inliers
    if(outputMask != null)
        outputMask.setToSync(Speedy.Matrix(1, n, mask));

    // done!
    return bestPose;
}

/**
 * Find a homography matrix with 6 degrees of freedom (rotation and translation) instead of the usual 8 of the DLT
 * @param referencePoints 2 x n matrix with reference points in a plane parallel to the image plane (Z = z0 > 0)
 * @param observedPoints 2 x n matrix with the observed points corresponding to the reference points
 * @param cameraIntrinsics 3x3 matrix
 * @param options options
 * @returns 3x3 homography matrix or a matrix of NaNs if no suitable homography is found
 */
export function find6DoFHomography(referencePoints: SpeedyMatrix, observedPoints: SpeedyMatrix, cameraIntrinsics: SpeedyMatrix, options: find6DoFHomographyOptions = {}): SpeedyPromise<SpeedyMatrix>
{
    const n = referencePoints.columns;
    const settings = Object.assign({}, DEFAULT_FIND6DOFHOMOGRAPHY_OPTIONS, options);
    const refinementQuality = Math.max(0, Math.min(settings.refinementQuality, 1));
    const reprojectionError = settings.reprojectionError;
    const mask = settings.mask;

    // validate
    if(n < 4)
        return Speedy.Promise.reject(new IllegalArgumentError('find6DofHomography() requires at least 4 points'));
    else if(referencePoints.columns != observedPoints.columns || referencePoints.rows != 2 || observedPoints.rows != 2)
        return Speedy.Promise.reject(new IllegalArgumentError('Bad input'));
    else if(cameraIntrinsics.columns != 3 || cameraIntrinsics.rows != 3)
        return Speedy.Promise.reject(new IllegalArgumentError('Bad intrinsics'));

    // find a pose. 6DoF: 3 for rotation + 3 for translation
    const pose = solvePlanarPnPRansac(referencePoints, observedPoints, cameraIntrinsics, options);

    /*
    DEBUG && print({
        find6DoFHomography: {
            R: pose.block(0, 2, 0, 2).toString(),
            t: pose.block(0, 2, 3, 3).toString(),
            //q: new Quaternion()._fromRotationMatrix(pose.block(0, 2, 0, 2)).toString(),
        }
    });
    */

    // build an initial homography
    const hom = buildHomography(cameraIntrinsics, pose);
    const entries = Array.from<number>(hom);
    const homography = Speedy.Matrix(3, 3, entries);

    // quit without refinement (for testing purposes)
    // we can expect a coarse estimate of the camera intrinsics
    if(refinementQuality == 0 || Number.isNaN(entries[0]))
        return Speedy.Promise.resolve(homography);

    // refine the homography with DLT + RANSAC
    const src = referencePoints, dest = observedPoints;
    const intermediate = Speedy.Matrix.Zeros(2, n);

    return Speedy.Matrix.applyPerspectiveTransform(intermediate, src, homography)
    .then(intermediate =>
        Speedy.Matrix.findHomography(
            Speedy.Matrix.Zeros(3),
            intermediate,
            dest,
            {
                method: 'pransac',
                numberOfHypotheses: Math.ceil(512 * refinementQuality), // XXX we can reduce this number without compromising quality
                bundleSize: Math.ceil(128 * refinementQuality),
                reprojectionError: reprojectionError,
                mask,
            }
        )
    )
    .then(adjustment =>
        adjustment.setTo(adjustment.times(homography))
    );
}

/*
// refine homography. pass only inliers!
export function refineHomography(homography: SpeedyMatrix, referencePoints: SpeedyMatrix, observedPoints: SpeedyMatrix): SpeedyMatrix
{
    //return homography;
    const n = referencePoints.columns;
    const P = referencePoints.read();
    const Q = observedPoints.read();
    const h = mat3(0);
    const grad = mat3(0); // or 9x1 vector
    const delta = mat3(0);
    const rate = 0.002;
    const threshold = 1e-4;
    const maxIterations = 100;
    const thr2 = threshold * threshold;
    let it = 0, error = 0;

    h.set(homography.read());

    // gradient descent
    // TODO Gauss-Newton / OLS ?
    for(it = 0; it < maxIterations; it++) {

        error = 0;
        grad.fill(0);

        for(let j = 0; j < n; j += 2) {
            const px = P[j], py = P[j+1], qx = Q[j], qy = Q[j+1];
            const num1 = h[0] * px + h[3] * py + h[6];
            const num2 = h[1] * px + h[4] * py + h[7];
            const den = h[2] * px + h[5] * py + h[8];
            const den2 = den * den;
            const dx = num1 / den - qx;
            const dy = num2 / den - qy;

            grad[0] += dx * (px / den);
            grad[1] += dy * (px / den);
            grad[2] += (dx * num1 + dy * num2) * px / den2;
            grad[3] += dx * (py / den);
            grad[4] += dy * (py / den);
            grad[5] += (dx * num1 + dy * num2) * py / den2;
            grad[6] += dx / den;
            grad[7] += dy / den;
            grad[8] += (dx * num1 + dy * num2) / den2;

            error += dx*dx + dy*dy;
        }

        grad[2] = -grad[2];
        grad[5] = -grad[5];
        grad[8] = -grad[8];
        error *= 0.5 / n;

        if(error < thr2)
            break;

        scale(delta, grad, rate);
        sub(h, h, delta);

    }

    DEBUG && print({
        refineHomography: {
            iterations: it,
            error: Math.sqrt(error),
            grad: Math.sqrt(grad.reduce((s,x) => s+x*x, 0)),
        }
    });

    return Speedy.Matrix(3, 3, Array.from(h));
}
*/




// ----------------------------------------------------------------------------
// private stuff
// ----------------------------------------------------------------------------




/**
 * Build a homography matrix
 * @param cameraIntrinsics 3x3 intrinsics
 * @param cameraExtrinsics 3x4 extrinsics
 * @returns 3x3 homography as a TinyMatrix
 */
function buildHomography(cameraIntrinsics: SpeedyMatrix, cameraExtrinsics: SpeedyMatrix): TinyMatrix
{
    const K = mat3(cameraIntrinsics.read());
    const fx = K[0], fy = K[4], cx = K[6], cy = K[7];
    const z0 = getZ0(fx);

    /*

    Convert points from 2D image space to 3D view space

    1. unproject by inverting K
    2. scale by z0 (similar triangles)
    3. translate Z=0 (input points) to Z=z0 (target plane in view space)

    so let's pre-multiply the input points by

    [ 1   0   0   0 ]   [ z0   0   0   0 ]   [ 1/fx   0     0  -cx/fx ]
    [ 0   1   0   0 ] * [  0  z0   0   0 ] * [  0    1/fy   0  -cy/fy ]
    [ 0   0   1  z0 ]   [  0   0  z0   0 ]   [  0     0     1     0   ]
    [ 0   0   0   1 ]   [  0   0   0   1 ]   [  0     0     0     1   ]
        translate             scale                  unproject

    each input point is thought of as a 4x1 homogeneous column vector with its
    third coordinate set to zero (i.e., input points are given at Z=0).

    Note: in practice, points are given as 3x1 homogeneous vectors because Z=0.

    */

    // pre-multiply the input points by this adjustment matrix
    //A4.fill(0);
    A4[0] = z0/fx;
    A4[5] = z0/fy;
    A4[10] = z0;
    A4[12] = -cx*z0/fx;
    A4[13] = -cy*z0/fy;
    A4[14] = z0;
    A4[15] = 1;

    // compose with the pose. The result M is 3x4
    const E = mat3x4(cameraExtrinsics.read());
    mul(M, E, A4);

    // remove the third column from the extrinsics matrix
    // (input points are always given at Z=0)
    rt[0] = M[0]; // r1
    rt[1] = M[1];
    rt[2] = M[2];
    rt[3] = M[3]; // r2
    rt[4] = M[4];
    rt[5] = M[5];
    rt[6] = M[9]; // t
    rt[7] = M[10];
    rt[8] = M[11];

    // build the homography by rotating, translating and projecting 3D points
    // back to 2D image space
    mul(H, K, rt);

    // normalize it?
    const scale = 1 / H[8];
    for(let i = 0; i < 9; i++)
        H[i] *= scale;

    // done!
    return H;
}

/**
 * Given a homography matrix and n correspondences (pi, qi), compute the reprojection error
 * @param homography 3x3 homography matrix
 * @param p reference points as a 2 x n matrix
 * @param q observed points as a 2 x n matrix
 * @param threshold for a point to be considered an outlier
 * @param mask inliers mask (output)
 * @returns a measure of the error (less is better)
 */
function computeReprojectionError(homography: TinyMatrix, p: number[], q: number[], threshold: number = 3, mask: number[] = []): number
{
    const [ h11, h21, h31, h12, h22, h32, h13, h23, h33 ] = homography;
    const [ ih11, ih21, ih31, ih12, ih22, ih32, ih13, ih23, ih33 ] = inverse(invH, homography);
    const n = p.length / 2;
    const thr2 = threshold * threshold;
    let totalError = 0;

    mask.length = n;
    mask.fill(0);

    // sanity check
    if(Number.isNaN(h11 * ih11))
        return Number.POSITIVE_INFINITY;

    // for each point correspondence (p,q)
    for(let i = 0, j = 0; i < n; i++, j += 2) {
        const px = p[j+0];
        const py = p[j+1];
        const pz = 1; // homogeneous

        const qx = q[j+0];
        const qy = q[j+1];
        const qz = 1;

        // compute the reprojection error H*p - q
        const hpx = h11 * px + h12 * py + h13 * pz;
        const hpy = h21 * px + h22 * py + h23 * pz;
        const hpz = h31 * px + h32 * py + h33 * pz;

        const ux = hpx / hpz, uy = hpy / hpz;
        const vx = qx / qz, vy = qy / qz;

        const dx = ux - vx, dy = uy - vy;
        const error2 = dx*dx + dy*dy;

        // compute the reprojection error Hinv*q - p
        const ihqx = ih11 * qx + ih12 * qy + ih13 * qz;
        const ihqy = ih21 * qx + ih22 * qy + ih23 * qz;
        const ihqz = ih31 * qx + ih32 * qy + ih33 * qz;

        const iux = ihqx / ihqz, iuy = ihqy / ihqz;
        const ivx = px / pz, ivy = py / pz;

        const idx = iux - ivx, idy = iuy - ivy;
        const ierror2 = idx*idx + idy*idy;

        // accumulate
        totalError += error2 + ierror2;
        if(error2 < thr2 && ierror2 < thr2)
            mask[i] = 1; // this is an inlier

        /*
        DEBUG && mask[i] && print({
            reprojectionError: {
                p: vec3([px,py,pz]),
                q: vec3([qx,qy,qz]),

                u: vec2([ux,uy]),
                v: vec2([vx,vy]),
                error2,

                iu: vec2([iux, iuy]),
                iv: vec2([ivx, ivy]),
                ierror2,

                thr2,
                inlier: mask[i]
            }
        });
        */
    }

    // return the average error
    return Math.sqrt(totalError / n);
}

/**
 * Given n 3D points u[i] and a pivot index, find j such that || u[j] - u[pivot] || is maximized
 * @param u points
 * @param pivot index
 * @param n the size of the dataset
 * @returns an index of u
 */
function findFarthestPointIndex(u: TinyMatrix[], n: number, pivot: number = 0): number
{
    const u0 = u[pivot];

    if(n > u.length)
        throw new IllegalArgumentError();

    let maxdist = 0, idx = 0;
    for(let i = 0; i < n; i++) {
        const dist = distance2(u0, u[i]);

        if(dist > maxdist) {
            maxdist = dist;
            idx = i;
        }
    }

    return idx;
}

/**
 * Find a vector that is perpendicular to the planar target in view space
 * @param u
 * @param v
 * @param n the size of the dataset
 * @returns normal vector with length 1
 */
function findNormalVector(u: TinyMatrix[], v: TinyMatrix[], n: number): TinyMatrix
{
    // validate
    if(u.length < 4 || v.length < 4 || u.length != v.length || n > u.length)
        throw new IllegalArgumentError();

    // let's pick 4 points from the dataset
    const o = 0;
    const i = Math.floor((n-1) / 3);
    const j = Math.floor((n-1) * 2 / 3);
    const k = n-1;

    // find the ratios si/s0, sj/s0 and sk/s0
    const ratios = findRatios(u, v, n, o, i, j, k);
    if(Number.isNaN(ratios[0]))
        return vec3(Number.NaN);

    // compute a normal vector
    const v0 = v[o], vi = v[i], vj = v[j];
    scale(ri, vi, ratios[0]);
    sub(ri, ri, v0);
    scale(rj, vj, ratios[1]);
    sub(rj, rj, v0);
    normalize(nvec, cross(nvec, ri, rj));

    /*
    DEBUG && print({
        normal: {
            _x,
            ri, rj,
            nvec
        }
    });
    */

    // done!
    return nvec;
}

/**
 * Find the ratios si/s0, sj/s0 and sk/s0
 * @param u 
 * @param v 
 * @param n the size of the dataset
 * @param o index of the pivot
 * @param i index of a point
 * @param j index of a point
 * @param k index of a point
 * @returns the ratios si/s0, sj/s0 and sk/s0
 */
function findRatios(u: TinyMatrix[], v: TinyMatrix[], n: number, o: number, i: number, j: number, k: number): TinyMatrix
{
    // validate
    if(u.length < 4 || v.length < 4 || u.length != v.length || n > u.length)
        throw new IllegalArgumentError();
    else if(Math.min(o, i, j, k) < 0 || Math.max(o, i, j, k) >= n)
        throw new IllegalArgumentError();

    // pick the points from the dataset
    const u0 = u[o], ui = u[i], uj = u[j], uk = u[k];
    const v0 = v[o], vi = v[i], vj = v[j], vk = v[k];

    /*
    DEBUG && print({
        unprojectedPoints: {
            u: { u0, ui, uj, uk },
            v: { v0, vi, vj, vk },
            phi_0i: angle(v0, vi),
            phi_0j: angle(v0, vj),
            phi_0k: angle(v0, vk),
        }
    });
    */

    // let wa be ua - u0 for a in { i, j, k }
    sub(wi, ui, u0);
    sub(wj, uj, u0);
    sub(wk, uk, u0);

    /*
    DEBUG && print({
        planeBasis: {
            wi, wj, wk,
        }
    });
    */

    // find (ai, aj) such that wk = ai wi + aj wj
    const det2 = wi[0] * wj[1] - wi[1] * wj[0];
    if(Math.abs(det2) < EPSILON) // wi and wj are colinear
        return vec3(Number.NaN);

    const ai = (wj[1] * wk[0] - wj[0] * wk[1]) / det2;
    const aj = (wi[0] * wk[1] - wi[1] * wk[0]) / det2;

    /*
    DEBUG && print({
        planePair: {
            det2,
            ai, aj,
        }
    });
    */

    // solve Ax = b for x = [ si/s0  sj/s0  sk/s0 ]'
    const bm = ai + aj - 1;

    _b[0] = bm * v0[0];
    _b[1] = bm * v0[1];
    _b[2] = bm * v0[2];

    _A[0] = ai * vi[0],
    _A[1] = ai * vi[1],
    _A[2] = ai * vi[2],
    _A[3] = aj * vj[0],
    _A[4] = aj * vj[1],
    _A[5] = aj * vj[2],
    _A[6] = -vk[0],
    _A[7] = -vk[1],
    _A[8] = -vk[2]

    /*
    DEBUG && print({
        findRatios: {
            _A,
            detA: determinant(_A),
            _b
        }
    });
    */

    inverse(_invA, _A);
    mul(_x, _invA, _b);
    return _x;
}

/**
 * Find z0, the distance along the Z-axis between the center of projection and
 * the plane of the reference points, which is parallel to the image plane
 * @param fx focal length of the camera
 * @param targetWidthInMeters
 * @param sensorWidthInMeters
 * @returns Z distance
 */
function getZ0(fx: number, targetWidthInMeters: number = DEFAULT_TARGET_WIDTH_IN_METERS, sensorWidthInMeters: number = DEFAULT_SENSOR_WIDTH_IN_METERS): number
{
    // Actually, in camera-model.ts, we work with the image plane being measured
    // in virtual units rather than mm. I'm just picking this number to get a
    // nice multiplier. The result will be in virtual units rather than meters.
    const PIXELS_PER_WORLD_UNIT = 20; // XXX NDC

    // fx is the focal length in "pixels" (the projection distance in the pinhole model)
    // It's the same as f * sx, where f is the focal length in world units and
    // sx is the number of "pixels" per world unit
    // "pixels" means image plane units
    const f = fx / PIXELS_PER_WORLD_UNIT;

    // The ratio between target size and image size in view space.
    // Since this is set arbitrarily, we can see that the translation
    // vector returned by solvePlanarPnP() is only defined up to a scale
    const r = targetWidthInMeters / sensorWidthInMeters;

    // z0 should be greater than fx; vi's should not be ~parallel,
    // so we pick a small multiplier r
    const z0 = r * f;

    // done!
    return z0;
}




// ----------------------------------------------------------------------------
// The following routines implement matrix and vector operations with minimal
// overhead. They only operate on small matrices. They are meant to be very
// lightweight and specific. solvePlanarPnP() is meant to be used often!!!
// 
// maybe move these to a separate module? So far they're only used here...
// maybe port everything to WASM?
// ----------------------------------------------------------------------------




// instantiate a matrix
function mat(copy: TinyMatrix): TinyMatrix;
function mat(rows: number, cols?: number, entries?: TinyMatrix | number[] | number): TinyMatrix;

function mat(rows: number | TinyMatrix, cols: number = rows as number, entries: TinyMatrix | number[] | number = 0): TinyMatrix
{
    if(typeof rows == 'object')
        return mat(rows._rows, rows._cols, rows); // clone

    const isSequence = (typeof entries == 'object');
    if(isSequence && entries.length != rows * cols)
        throw new IllegalArgumentError();

    const M = (isSequence ? new Float64Array(entries) : new Float64Array(rows * cols)) as TinyMatrix;
    M._rows = rows;
    M._cols = cols;

    if(typeof entries == 'number')
        M.fill(entries);

    return M;
}

function mat2(entries: number[] | number): TinyMatrix { return mat(2, 2, entries); }
function mat3(entries: number[] | number): TinyMatrix { return mat(3, 3, entries); }
function mat4(entries: number[] | number): TinyMatrix { return mat(4, 4, entries); }
function mat3x4(entries: number[] | number): TinyMatrix { return mat(3, 4, entries); }
function vec2(entries: number[] | number): TinyMatrix { return mat(2, 1, entries); }
function vec3(entries: number[] | number): TinyMatrix { return mat(3, 1, entries); }
function vec4(entries: number[] | number): TinyMatrix { return mat(4, 1, entries); }

// matrix addition
function add(C: TinyMatrix, A: TinyMatrix, B: TinyMatrix): TinyMatrix
{
    const rowsA = A._rows, colsA = A._cols;
    const rowsB = B._rows, colsB = B._cols;
    const rowsC = C._rows, colsC = C._cols;

    if(rowsA != rowsB || colsA != colsB || rowsA != rowsC || colsA != colsC)
        throw new IllegalArgumentError();

    for(let i = 0; i < C.length; i++)
        C[i] = A[i] + B[i];

    return C;
}

// matrix subtraction
function sub(C: TinyMatrix, A: TinyMatrix, B: TinyMatrix): TinyMatrix
{
    const rowsA = A._rows, colsA = A._cols;
    const rowsB = B._rows, colsB = B._cols;
    const rowsC = C._rows, colsC = C._cols;

    if(rowsA != rowsB || colsA != colsB || rowsA != rowsC || colsA != colsC)
        throw new IllegalArgumentError();

    for(let i = 0; i < C.length; i++)
        C[i] = A[i] - B[i];

    return C;
}

// matrix multiplication
function mul(C: TinyMatrix, A: TinyMatrix, B: TinyMatrix): TinyMatrix
{
    const rowsA = A._rows, colsA = A._cols;
    const rowsB = B._rows, colsB = B._cols;
    const rowsC = C._rows, colsC = C._cols;

    if(rowsC != rowsA || colsC != colsB || colsA != rowsB)
        throw new IllegalArgumentError();

    C.fill(0);
    for(let k = 0; k < colsC; k++) {
        for(let j = 0; j < rowsA; j++) {
            for(let i = 0; i < colsA; i++)
                C[k * rowsC + j] += A[i * rowsA + j] * B[k * rowsB + i]
        }
    }

    return C;
}

// multiplication by a scalar
function scale(B: TinyMatrix, A: TinyMatrix, s: number): TinyMatrix
{
    if(A._rows != B._rows || A._cols != B._cols)
        throw new IllegalArgumentError();

    for(let i = 0; i < B.length; i++)
        B[i] = A[i] * s;

    return B;
}

// inverse of a 3x3 matrix
function inverse(B: TinyMatrix, A: TinyMatrix): TinyMatrix
{
    if(A._rows != B._rows || A._cols != B._cols)
        throw new IllegalArgumentError();

    // matrix of minors
    const m0 = A[4] * A[8] - A[7] * A[5];
    const m1 = A[3] * A[8] - A[6] * A[5];
    const m2 = A[3] * A[7] - A[6] * A[4];
    const m3 = A[1] * A[8] - A[7] * A[2];
    const m4 = A[0] * A[8] - A[6] * A[2];
    const m5 = A[0] * A[7] - A[6] * A[1];
    const m6 = A[1] * A[5] - A[4] * A[2];
    const m7 = A[0] * A[5] - A[3] * A[2];
    const m8 = A[0] * A[4] - A[3] * A[1];

    // determinant of A
    const det = A[0] * m0 - A[1] * m1 + A[2] * m2;
    if(Math.abs(det) < EPSILON)
        return B.fill(Number.NaN);

    // invert via cofactor expansion
    const idet = 1.0 / det;

    B[0] = m0 * idet;
    B[1] = -m3 * idet;
    B[2] = m6 * idet;
    B[3] = -m1 * idet;
    B[4] = m4 * idet;
    B[5] = -m7 * idet;
    B[6] = m2 * idet;
    B[7] = -m5 * idet;
    B[8] = m8 * idet;

    return B;
}

// determinant of a 3x3 matrix
function determinant(A: TinyMatrix): number
{
    const m0 = A[4] * A[8] - A[7] * A[5];
    const m1 = A[3] * A[8] - A[6] * A[5];
    const m2 = A[3] * A[7] - A[6] * A[4];

    return A[0] * m0 - A[1] * m1 + A[2] * m2;
}

// normalize a 3D vector
function normalize(w: TinyMatrix, v: TinyMatrix): TinyMatrix
{
    const len2 = dot(v, v);
    const len = Math.sqrt(len2);

    w[0] = v[0] / len;
    w[1] = v[1] / len;
    w[2] = v[2] / len;

    return w;
}

// find the squared distance between two points in 3D
function distance2(u: TinyMatrix, v: TinyMatrix): number
{
    const dx = u[0] - v[0];
    const dy = u[1] - v[1];
    const dz = u[2] - v[2];

    return dx*dx + dy*dy + dz*dz;
}

// dot product u'v; u and v are 3D
function dot(u: TinyMatrix, v: TinyMatrix): number
{
    return u[0]*v[0] + u[1]*v[1] + u[2]*v[2];
}

// angle in degrees between two unit vectors
function angle(u: TinyMatrix, v: TinyMatrix): number
{
    return Math.acos(dot(u, v)) * 180 / Math.PI;
}

// cross product u x v
function cross(w: TinyMatrix, u: TinyMatrix, v: TinyMatrix): TinyMatrix
{
    w[0] = u[1] * v[2] - u[2] * v[1];
    w[1] = u[2] * v[0] - u[0] * v[2];
    w[2] = u[0] * v[1] - u[1] * v[0];

    return w;
}

// outer product u v'
function outer(w: TinyMatrix, u: TinyMatrix, v: TinyMatrix): TinyMatrix
{
    w[0] = u[0] * v[0], u[1] * v[0], u[2] * v[0];
    w[1] = u[0] * v[1], u[1] * v[1], u[2] * v[1];
    w[2] = u[0] * v[2], u[1] * v[2], u[2] * v[2];

    return w;
}

// convert unit quaternion to rotation matrix
function quat2mat(R: TinyMatrix, q: TinyMatrix): TinyMatrix
{
    const x = q[0], y = q[1], z = q[2], w = q[3];
    const x2 = 2*x*x, y2 = 2*y*y, z2 = 2*z*z;
    const xy = 2*x*y, xz = 2*x*z, yz = 2*y*z;
    const wx = 2*w*x, wy = 2*w*y, wz = 2*w*z;

    R[0] = 1-(y2+z2);
    R[1] = xy+wz;
    R[2] = xz-wy;
    R[3] = xy-wz;
    R[4] = 1-(x2+z2);
    R[5] = yz+wx;
    R[6] = xz+wy;
    R[7] = yz-wx;
    R[8] = 1-(x2+y2);

    return R;
}

// sweet print
function print(data: any, spaces: string = ''): void
{
    if(typeof data !== 'object') {
        console.log(spaces, data);
        return;
    }

    if(ArrayBuffer.isView(data)) {
        printmat(data as TinyMatrix, spaces);
        return;
    }

    for(const key of Object.keys(data)) {
        console.log('%s%s:', spaces, key);
        print(data[key], spaces + '  ');
    }

    if(spaces == '')
        console.log('\n');
}

// print matrix
function printmat(m: TinyMatrix, spaces: string = '', precision: number = 4): void
{
    const rows = m._rows, cols = m._cols;
    const indices = (row: number) => Array.from({ length: cols }, (_, i) => i * rows + row);

    console.log(Array.from({ length: rows }, (_, row) => indices(row)).map(
        indices => spaces + indices.map(k => m[k].toFixed(precision)).join('  ')
    ).join('\n'));
}
