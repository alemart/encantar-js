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
 * settings.ts
 * Settings of the Image Tracker
 */

/** Default tracking resolution */
export const DEFAULT_TRACKING_RESOLUTION = 'sm+';

/** Maximum number of keypoints to be stored for each reference image when in the training state */
export const TRAIN_MAX_KEYPOINTS = 1024; //512;

/** Percentage relative to the screen size adjusted to the aspect ratio of the reference image */
export const TRAIN_IMAGE_SCALE = 0.8; // ORB is not scale invariant

/** Normalized width & height of an image target, in pixels */
export const TRAIN_TARGET_NORMALIZED_SIZE = 1024; // keypoint positions are stored as fixed point

/** Used to identify the best maches */
export const SCAN_MATCH_RATIO = 0.7; // usually a value in [0.6, 0.8]

/** Maximum number of keypoints to be analyzed when in the scanning state */
export const SCAN_MAX_KEYPOINTS = 512;

/** Number of pyramid levels to be scanned by the corner detector when in the scanning & training states */
export const SCAN_PYRAMID_LEVELS = 4; //7;

/** Scale factor between pyramid levels to be scanned by the corner detector when in the scanning & training states */
export const SCAN_PYRAMID_SCALEFACTOR = 1.19; // 2 ^ 0.25

/** Threshold of the FAST corner detector used in the scanning/training states */
export const SCAN_FAST_THRESHOLD = 60;

/** Minimum number of accepted matches for us to move out from the scanning state */
export const SCAN_MIN_MATCHES = 20; //30;

/** When in the scanning state, we require the image to be matched during a few consecutive frames before accepting it */
export const SCAN_CONSECUTIVE_FRAMES = 30;//15;//45;

/** Reprojection error, in pixels, used when estimating a motion model (scanning state) */
export const SCAN_RANSAC_REPROJECTIONERROR = 5;

/** Number of tables used in the LSH-based keypoint matching */
export const SCAN_LSH_TABLES = 8; // up to 32

/** Hash size, in bits, used in the LSH-based keypoint matching */
export const SCAN_LSH_HASHSIZE = 15; // up to 16

/** Use the Nightvision filter when in the scanning/training state? */
export const SCAN_WITH_NIGHTVISION = true;

/** Nightvision filter: gain */
export const NIGHTVISION_GAIN = 0.3; // 0.2;

/** Nightvision filter: offset */
export const NIGHTVISION_OFFSET = 0.5;

/** Nightvision filter: decay */
export const NIGHTVISION_DECAY = 0.0;

/** Nightvision filter: quality level */
export const NIGHTVISION_QUALITY = 'low';

/** Kernel size (square) of the Gaussian filter applied before computing the ORB descriptors */
export const ORB_GAUSSIAN_KSIZE = 9;

/** Sigma of the Gaussian filter applied before computing the ORB descriptors */
export const ORB_GAUSSIAN_SIGMA = 2.0;

/** Kernel size (square) of the Gaussian filter applied before subpixel refinement for noise reduction */
export const SUBPIXEL_GAUSSIAN_KSIZE = 5;

/** Sigma of the Gaussian filter applied before subpixel refinement for noise reduction */
export const SUBPIXEL_GAUSSIAN_SIGMA = 1.0;

/** Subpixel refinement method */
export const SUBPIXEL_METHOD = 'bilinear-upsample'; // 'quadratic1d';

/** Minimum acceptable number of matched keypoints when in the tracking state */
export const TRACK_MIN_MATCHES = 4;//10; //20;

/** Maximum number of keypoints to be analyzed in the tracking state */
export const TRACK_MAX_KEYPOINTS = 200; //400; // <-- impacts performance!

/** Capacity of the keypoint detector used in the the tracking state */
export const TRACK_DETECTOR_CAPACITY = 2048; //4096;

/** Quality of the Harris/Shi-Tomasi corner detector */
export const TRACK_HARRIS_QUALITY = 0.005; // get a lot of keypoints

/** Use the Nightvision filter when in the tracking state? */
export const TRACK_WITH_NIGHTVISION = false; // produces shaking?

/** Relative size (%) of the (top, right, bottom, left) borders of the rectified image */
export const TRACK_RECTIFIED_BORDER = 0.15; //0.20;

/** Relative size (%) used to clip keypoints from the borders of the rectified image */
export const TRACK_CLIPPING_BORDER = TRACK_RECTIFIED_BORDER * 1.20; //1.25; //1.15;

/** Number of iterations used to refine the target image before tracking */
export const TRACK_REFINEMENT_ITERATIONS = 3;

/** Reprojection error, in pixels, used when estimating a motion model (tracking state) */
export const TRACK_RANSAC_REPROJECTIONERROR = 3; //2.5;

/** We use a N x N grid to spatially distribute the keypoints in order to compute a better homography */
export const TRACK_GRID_GRANULARITY = 10; //20; // the value of N

/** Used to identify the best maches */
export const TRACK_MATCH_RATIO = 0.75; // usually a value in [0.6, 0.8] - low values => strict tracking

/** Number of consecutive frames in which we tolerate a  "target lost" situation */
export const TRACK_LOST_TOLERANCE = 10;