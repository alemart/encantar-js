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
 * tracking.ts
 * Tracking state of the Image Tracker
 */

import Speedy from 'speedy-vision';
import { SpeedyPoint2 } from 'speedy-vision/types/core/speedy-point';
import { SpeedyVector2 } from 'speedy-vision/types/core/speedy-vector';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
import { SpeedyPipelineNodeImageSource } from 'speedy-vision/types/core/pipeline/nodes/images/source';
import { SpeedyPipelineNodeImagePortalSource, SpeedyPipelineNodeImagePortalSink } from 'speedy-vision/types/core/pipeline/nodes/images/portal';
import { SpeedyPipelineNodeKeypointPortalSource, SpeedyPipelineNodeKeypointPortalSink } from 'speedy-vision/types/core/pipeline/nodes/keypoints/portal';
import { SpeedyPipelineNodeKeypointSource } from 'speedy-vision/types/core/pipeline/nodes/keypoints/source';
import { SpeedyPipelineNodeKeypointMultiplexer } from 'speedy-vision/types/core/pipeline/nodes/keypoints/multiplexer';
import { SpeedyPipelineNodeResize } from 'speedy-vision/types/core/pipeline/nodes/transforms/resize';
import { SpeedyPipelineNodePerspectiveWarp } from 'speedy-vision/types/core/pipeline/nodes/transforms/perspective-warp';
import { SpeedyPipelineNodeKeypointBorderClipper } from 'speedy-vision/types/core/pipeline/nodes/keypoints/border-clipper';
import { SpeedyPipelineNodeKeypointTransformer } from 'speedy-vision/types/core/pipeline/nodes/keypoints/transformer';
import { SpeedyKeypoint, SpeedyTrackedKeypoint, SpeedyMatchedKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
import { ImageTracker, ImageTrackerOutput, ImageTrackerStateName, ImageTrackerResult, TrackableImage } from '../image-tracker';
import { ImageTrackerState, ImageTrackerStateOutput } from './state';
import { ImageTrackerEvent } from '../image-tracker-event';
import { Nullable, Utils } from '../../../utils/utils';
import { ReferenceImage } from '../reference-image';
import { CameraModel } from '../../../geometry/camera-model';
import { Viewer } from '../../../geometry/viewer';
import { Pose } from '../../../geometry/pose';
import { RigidTransform, StandardTransform } from '../../../geometry/transform';
import { IllegalOperationError, IllegalArgumentError, TrackingError } from '../../../utils/errors';
import {
    TRACK_RECTIFIED_BORDER, TRACK_CLIPPING_BORDER, TRACK_MIN_MATCHES, TRACK_LOST_TOLERANCE,
    NIGHTVISION_GAIN, NIGHTVISION_OFFSET, NIGHTVISION_DECAY, TRACK_WITH_NIGHTVISION,
    ORB_GAUSSIAN_KSIZE, ORB_GAUSSIAN_SIGMA,
    SUBPIXEL_GAUSSIAN_KSIZE, SUBPIXEL_GAUSSIAN_SIGMA,
    TRACK_HARRIS_QUALITY, TRACK_DETECTOR_CAPACITY, TRACK_MAX_KEYPOINTS,
    TRACK_RANSAC_REPROJECTIONERROR, TRACK_GRID_GRANULARITY, TRACK_MATCH_RATIO,
    NIGHTVISION_QUALITY,
    SUBPIXEL_METHOD,
} from '../settings';
import { Settings } from '../../../core/settings';


/** Whether or not we want to accelerate GPU-CPU transfers. Using turbo costs a slight delay on the tracking */
const USE_TURBO = true;

/** Number of PBOs; meaningful only when using turbo */
const NUMBER_OF_PBOS = 2;

/** Frame skipping; meaningful only when using turbo */
const TURBO_SKIP = 2;

/** A pair (a,b) of arrays of keypoints such that keypoint a[i] is a match to keypoint b[i] for all i */
type QualityMatches = [ SpeedyMatchedKeypoint[], SpeedyKeypoint[] ];



/**
 * The tracking state of the Image Tracker tracks
 * keypoints of the image target and updates the
 * rectification matrix
 */
export class ImageTrackerTrackingState extends ImageTrackerState
{
    /** tracked image */
    private _referenceImage: Nullable<ReferenceImage>;

    /** current homography (for warping) */
    private _warpHomography: SpeedyMatrix;

    /** current homography (for computing the pose) */
    private _poseHomography: SpeedyMatrix;

    /** initial homography (i.e., the homography we found when we first started tracking) */
    private _initialHomography: SpeedyMatrix; // from (full)screen to the actual target

    /** initial keypoints (i.e., the keypoints we found when we first started tracking) */
    private _initialKeypoints: SpeedyKeypoint[];

    /** a helper */
    private _counter: number;

    /** camera model */
    private _camera: CameraModel;

    /** predicted keypoints */
    private _predictedKeypoints: SpeedyMatchedKeypoint[];

    /** last pipeline output */
    private _lastPipelineOutput: SpeedyPipelineOutput;

    /** a helper */
    private _pipelineCounter: number;

    /** last output */
    private _lastOutput: ImageTrackerOutput;

    /** the number of consecutive frames in which we have lost the tracking */
    private _lostCounter: number;




    /**
     * Constructor
     * @param imageTracker
     */
    constructor(imageTracker: ImageTracker)
    {
        super('tracking', imageTracker);

        this._referenceImage = null;
        this._warpHomography = Speedy.Matrix.Eye(3);
        this._poseHomography = Speedy.Matrix.Eye(3);
        this._initialHomography = Speedy.Matrix.Eye(3);
        this._initialKeypoints = [];
        this._counter = 0;
        this._camera = new CameraModel();
        this._predictedKeypoints = [];
        this._lastPipelineOutput = { keypoints: [] };
        this._pipelineCounter = 0;
        this._lastOutput = {};
        this._lostCounter = 0;

        // we need at least 4 correspondences of points to compute a homography matrix
        Utils.assert(TRACK_MIN_MATCHES >= 4);
    }

    /**
     * Called as soon as this becomes the active state, just before update() runs for the first time
     * @param settings
     */
    onEnterState(settings: Record<string,any>)
    {
        const homography = settings.homography as SpeedyMatrix;
        const referenceImage = settings.referenceImage as Nullable<ReferenceImage>;
        const templateKeypoints = settings.templateKeypoints as SpeedyKeypoint[];
        const keypointPortalSink = settings.keypointPortalSink as SpeedyPipelineNodeKeypointPortalSink;
        const screenSize = settings.screenSize as SpeedySize; // this.screenSize is not yet set
        const keypointPortalSource = this._pipeline.node('keypointPortalSource') as SpeedyPipelineNodeKeypointPortalSource;

        // this shouldn't happen
        if(!referenceImage)
            throw new IllegalOperationError(`Can't track a null reference image`);

        // set attributes
        this._referenceImage = referenceImage;
        this._warpHomography = Speedy.Matrix(homography);
        this._poseHomography = Speedy.Matrix(homography);
        this._initialHomography = Speedy.Matrix(homography);
        this._initialKeypoints = templateKeypoints;
        this._counter = 0;
        this._predictedKeypoints = [];
        this._lastPipelineOutput = { keypoints: [] };
        this._pipelineCounter = 0;
        this._lastOutput = {};
        this._lostCounter = 0;

        // setup portals
        keypointPortalSource.source = keypointPortalSink;

        // setup camera
        this._camera.init(screenSize);

        // emit event
        const ev = new ImageTrackerEvent('targetfound', referenceImage);
        this._imageTracker.dispatchEvent(ev);

        // log
        Utils.log(`Tracking image "${referenceImage.name}"...`);
    }

    /**
     * Called when leaving the state
     */
    onLeaveState(): void
    {
        const referenceImage = this._referenceImage as ReferenceImage;

        // release the camera
        this._camera.release();

        // emit event
        const ev = new ImageTrackerEvent('targetlost', referenceImage);
        this._imageTracker.dispatchEvent(ev);
    }

    /**
     * Called just before the GPU processing
     * @returns promise
     */
    protected _beforeUpdate(): SpeedyPromise<void>
    {
        const imageRectifier = this._pipeline.node('imageRectifier') as SpeedyPipelineNodePerspectiveWarp;
        const borderClipper = this._pipeline.node('borderClipper') as SpeedyPipelineNodeKeypointBorderClipper;
        const keypointRectifier = this._pipeline.node('keypointRectifier') as SpeedyPipelineNodeKeypointTransformer;
        const screenSize = this.screenSize;

        /*
        // pause media (test)
        const source = this._pipeline.node('source') as SpeedyPipelineNodeImageSource;
        const media = source.media as SpeedyMedia;
        (media.source as HTMLVideoElement).pause();
        */

        // clip keypoints from the borders of the target image
        borderClipper.imageSize = screenSize;
        borderClipper.borderSize = Speedy.Vector2(
            screenSize.width * TRACK_CLIPPING_BORDER,
            screenSize.height * TRACK_CLIPPING_BORDER
        );

        // rectify the image
        return this._findImageWarp(this._warpHomography, screenSize).then(warp => {
            imageRectifier.transform = warp;
        });
    }

    /**
     * GPU processing
     * @returns promise with the pipeline results
     */
    protected _gpuUpdate(): SpeedyPromise<SpeedyPipelineOutput>
    {
        //return super._gpuUpdate();

        // No turbo?
        if(!USE_TURBO || Settings.powerPreference == 'low-power')
            return super._gpuUpdate();

        // When using turbo, we reduce the GPU usage by skipping every other frame
        const counter = this._pipelineCounter;
        this._pipelineCounter = (this._pipelineCounter + 1) % TURBO_SKIP;

        // Skip frame
        if(counter != 0) {
            if(this._lastPipelineOutput.keypoints !== undefined) {
                this._predictedKeypoints = this._predictKeypoints(
                    this._lastPipelineOutput.keypoints,
                    this._initialKeypoints
                );
            }
            else
                this._predictedKeypoints.length = 0;

            this._lastPipelineOutput.keypoints = this._predictedKeypoints;
            return Speedy.Promise.resolve(this._lastPipelineOutput);
        }

        // Run the pipeline and store the results
        return super._gpuUpdate().then(results => {
            this._lastPipelineOutput = results;
            return results;
        });
    }

    /**
     * Post processing that takes place just after the GPU processing
     * @param result pipeline results
     * @returns state output
     */
    protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>
    {
        const imageRectifier = this._pipeline.node('imageRectifier') as SpeedyPipelineNodePerspectiveWarp;
        const keypoints = result.keypoints as SpeedyMatchedKeypoint[];
        const image = result.image as SpeedyMedia | undefined;
        const referenceImage = this._referenceImage as ReferenceImage;

        // find the best keypoint matches
        return this._preprocessMatches(keypoints, this._initialKeypoints).then(matches => {

            // find motion models
            return Speedy.Promise.all<SpeedyMatrix>([
                this._findAffineMotion(matches),
                this._findPerspectiveMotion(matches)
            ]);

        }).then(([affineMotion, perspectiveMotion]) => {

            const lowPower = (Settings.powerPreference == 'low-power');
            const frozen = !(!USE_TURBO || lowPower || this._counter % TURBO_SKIP == 0);

            // update warp homography
            const delay = NUMBER_OF_PBOS * (!lowPower ? TURBO_SKIP : 1);
            const remainder = delay >>> 1; // we want remainder > 0, so it skips the first frame
            if(!USE_TURBO || this._counter % delay == remainder)
                this._warpHomography.setToSync(this._warpHomography.times(affineMotion));

            // update pose homography
            if(!frozen)
                this._poseHomography.setToSync(this._warpHomography.times(perspectiveMotion));

            // update counter
            this._counter = (this._counter + 1) % delay;

            // update the camera
            if(!frozen)
                return this._camera.update(this._poseHomography, this.screenSize);
            else
                return this._camera.matrix;

        }).then(_ => {

            // find the inverse of the rectification matrix
            const rectificationMatrix = imageRectifier.transform;
            const inverseRectificationMatrix = Speedy.Matrix(rectificationMatrix.inverse());

            // move keypoints from rectified space back to image space
            const n = keypoints.length;
            const coords: number[] = new Array(2*n);
            for(let i = 0, j = 0; i < n; i++, j += 2) {
                coords[j] = keypoints[i].position.x;
                coords[j+1] = keypoints[i].position.y;
            }

            return Speedy.Matrix.applyPerspectiveTransform(
                Speedy.Matrix.Zeros(2, n),
                Speedy.Matrix(2, n, coords),
                inverseRectificationMatrix
            );

            /*
            // test image center
            const coords2: number[] = new Array(2 * n);
            for(let i = 0, j = 0; i < n; i++, j += 2) {
                coords2[j] = this._imageTracker.screenSize.width / 2;
                coords2[j+1] = this._imageTracker.screenSize.height / 2;
                if(i % 2 == 0) {
                    coords2[j] = this._imageTracker.screenSize.width / 4;
                    coords2[j+1] = this._imageTracker.screenSize.height / 4;
                }
            }

            return Speedy.Matrix.applyPerspectiveTransform(
                Speedy.Matrix.Zeros(2, n),
                Speedy.Matrix(2, n, coords2),
                this._poseHomography
                //this._warpHomography
            );
            */

        }).then(mat => {

            /*

            const n = keypoints.length;
            const coords = mat.read();

            // ** this will interfere with the calculations when frame skipping is on **

            // get keypoints in image space
            for(let i = 0, j = 0; i < n; i++, j += 2) {
                keypoints[i].position.x = coords[j];
                keypoints[i].position.y = coords[j+1];
            }

            */

            // find a polyline surrounding the target
            return this._findPolyline(this._poseHomography, this.screenSize);
            //return this._findPolyline(this._warpHomography, this.screenSize);

        }).then(polyline => {

            // we let the target object be at the origin of the world space
            // (identity transform). We also perform a change of coordinates,
            // so that we move out from pixel space and into normalized space
            const modelMatrix = this._camera.denormalizer(); // ~ "identity matrix"
            const transform = new StandardTransform(modelMatrix);
            const pose = new Pose(transform);

            // given the current state of the camera model, we get a viewer
            // compatible with the pose of the target
            const viewer = new Viewer(this._camera);

            // the trackable object
            const trackable: TrackableImage = {
                pose: pose,
                referenceImage: referenceImage
            };

            // the result generated by the image tracker
            const result: ImageTrackerResult = {
                tracker: this._imageTracker,
                trackables: [ trackable ],
                viewer: viewer
            };

            // build and save the output
            this._lastOutput = {
                exports: result,
                cameraMatrix: this._camera.matrix,
                homography: this._warpHomography,
                //keypoints: keypoints,
                screenSize: this.screenSize,
                image: image,
                polyline: polyline,
            };

            // we have successfully tracked the target in this frame
            this._lostCounter = 0;

            // done!
            return {
                nextState: 'tracking',
                trackerOutput: this._lastOutput
            };

        }).catch(err => {

            // give some tolerance to tracking errors
            if(err instanceof TrackingError) {
                if(++this._lostCounter <= TRACK_LOST_TOLERANCE) {
                    //console.log("ABSORB",this._lostCounter,err.toString())
                    // absorb the error
                    return {
                        nextState: 'tracking',
                        trackerOutput: this._lastOutput
                    };
                }
            }

            // lost tracking
            Utils.warning(`The target has been lost! ${err.toString()}`);
            this._camera.reset();

            // go back to the scanning state
            return {
                nextState: 'scanning',
                trackerOutput: {
                    image: image,
                    screenSize: this.screenSize,
                },
            };

        });
    }

    /**
     * Find quality matches between two sets of keypoints
     * @param currKeypoints keypoints of the current frame
     * @param prevKeypoints keypoints of the previous frame
     * @returns quality matches
     */
    private _findQualityMatches(currKeypoints: SpeedyMatchedKeypoint[], prevKeypoints: SpeedyKeypoint[]): QualityMatches
    {
        const result: QualityMatches = [ [], [] ];
        const n = currKeypoints.length;

        for(let i = 0; i < n; i++) {
            const currKeypoint = currKeypoints[i];

            if(currKeypoint.matches[0].index >= 0 && currKeypoint.matches[1].index >= 0) {
                const d1 = currKeypoint.matches[0].distance;
                const d2 = currKeypoint.matches[1].distance;

                if(d1 <= TRACK_MATCH_RATIO * d2) {
                    const prevKeypoint = prevKeypoints[currKeypoint.matches[0].index];

                    result[0].push(currKeypoint);
                    result[1].push(prevKeypoint);
                }
            }
        }

        return result;
    }

    /**
     * Find a better spatial distribution of the input matches
     * @param matches quality matches
     * @returns refined quality matches
     */
    private _refineQualityMatches(matches: QualityMatches): QualityMatches
    {
        const currKeypoints = matches[0];
        const prevKeypoints = matches[1];

        // find a better spatial distribution of the keypoints
        const indices = this._distributeKeypoints(currKeypoints, TRACK_GRID_GRANULARITY);
        const n = indices.length; // number of refined matches

        // assemble output
        const result: QualityMatches = [ new Array(n), new Array(n) ];
        for(let i = 0; i < n; i++) {
            result[0][i] = currKeypoints[indices[i]];
            result[1][i] = prevKeypoints[indices[i]];
        }

        // done!
        return result;
    }

    /**
     * Spatially distribute keypoints over a grid
     * @param keypoints keypoints to be distributed
     * @param gridCells number of grid elements in each axis
     * @returns a list of indices of keypoints[]
     */
    private _distributeKeypoints(keypoints: SpeedyKeypoint[], gridCells: number): number[]
    {
        // get the coordinates of the keypoints
        const n = keypoints.length;
        const points: number[] = new Array(2 * n);
        for(let i = 0, j = 0; i < n; i++, j += 2) {
            points[j] = keypoints[i].x;
            points[j+1] = keypoints[i].y;
        }

        // normalize the coordinates to [0,1] x [0,1]
        this._normalizePoints(points);

        // distribute the keypoints over a grid
        const numberOfCells = gridCells * gridCells;
        const grid: number[] = (new Array(numberOfCells)).fill(-1);
        for(let i = 0, j = 0; i < n; i++, j += 2) {
            // find the grid location of the i-th point
            const xg = Math.floor(points[j] * gridCells); // 0 <= xg,yg < gridCells
            const yg = Math.floor(points[j+1] * gridCells);

            // store the index of the i-th point in the grid
            grid[yg * gridCells + xg] = i;
        }

        // retrieve points of the grid
        const indices: number[] = [];
        for(let g = 0; g < numberOfCells; g++) {
            if(grid[g] >= 0) {
                const i = grid[g];
                indices.push(i);
            }
        }

        // done!
        return indices;
    }

    /**
     * Normalize points to [0,1)^2
     * @param points 2 x n matrix of points in column-major format
     * @returns points
     */
    private _normalizePoints(points: number[]): number[]
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

    /**
     * Find a matrix with the coordinates of quality matches
     * @param matches n quality matches
     * @returns a 2 x 2n matrix split into two 2 x n blocks [ prevKeypoints | currKeypoints ]
     */
    private _findMatrixOfMatches(matches: QualityMatches): SpeedyMatrix
    {
        const n = matches[0].length;
        Utils.assert(n > 0);

        // sets of keypoints
        const currKeypoints = matches[0];
        const prevKeypoints = matches[1];

        // get the coordinates of the keypoints of the set of refined matches
        const src: number[] = new Array(2*n);
        const dst: number[] = new Array(2*n);

        for(let i = 0, j = 0; i < n; i++, j += 2) {
            src[j] = prevKeypoints[i].x;
            src[j+1] = prevKeypoints[i].y;

            dst[j] = currKeypoints[i].x;
            dst[j+1] = currKeypoints[i].y;
        }

        // assemble the matrix
        return Speedy.Matrix(2, 2*n, src.concat(dst));
    }

    /**
     * Preprocess keypoint matches
     * @param currKeypoints keypoints of the current frame
     * @param prevKeypoints keypoints of the previous frame
     * @returns a promise that is rejected if there are not enough "good" matches, or that is resolved to a
     *          2 x 2n matrix split into two 2 x n blocks [ source x,y coordinates | dest x,y coordinates ]
     */
    private _preprocessMatches(currKeypoints: SpeedyMatchedKeypoint[], prevKeypoints: SpeedyKeypoint[]): SpeedyPromise<SpeedyMatrix>
    {
        // find and refine quality matches
        const qualityMatches = this._findQualityMatches(currKeypoints, prevKeypoints);
        const refinedMatches = this._refineQualityMatches(qualityMatches);

        // not enough matches?
        const n = refinedMatches[0].length;
        if(n < TRACK_MIN_MATCHES)
            return Speedy.Promise.reject(new TrackingError('Not enough data to compute a motion model'));

        // find matrix of matches
        const matrixOfMatches = this._findMatrixOfMatches(refinedMatches);

        // warp matrix of matches
        const result = Speedy.Matrix.Zeros(2, 2*n);
        return this._findKeypointWarp().then(transform =>

            Speedy.Matrix.applyAffineTransform(
                result,
                matrixOfMatches,
                transform.block(0,1,0,2)
            )

        );
    }

    /**
     * Find an affine motion model of the target image
     * @param preprocessedMatches 2 x 2n matrix split into two 2 x n blocks [ src | dest ]
     * @returns a promise that resolves to a 3x3 affine motion model (last row is [ 0  0  1 ])
     */
    private _findAffineMotion(preprocessedMatches: SpeedyMatrix): SpeedyPromise<SpeedyMatrix>
    {
        const model = Speedy.Matrix.Eye(3);
        const n = preprocessedMatches.columns / 2; // number of preprocessed matches

        // find motion model
        return Speedy.Matrix.findAffineTransform(
            model.block(0,1,0,2),
            preprocessedMatches.block(0,1,0,n-1),
            preprocessedMatches.block(0,1,n,2*n-1), {
            method: 'pransac',
            reprojectionError: TRACK_RANSAC_REPROJECTIONERROR,
            numberOfHypotheses: 512,
            bundleSize: 128,
        }).then(_ => {

            // validate the model
            const a00 = model.at(0,0);
            if(Number.isNaN(a00))
                throw new TrackingError(`Can't compute affine motion model: bad keypoints`);

            // done!
            return model;

        });
    }

    /**
     * Find a perspective motion model of the target image
     * @param preprocessedMatches 2 x 2n matrix split into two 2 x n blocks [ src | dest ]
     * @returns a promise that resolves to a 3x3 perspective motion model
     */
    private _findPerspectiveMotion(preprocessedMatches: SpeedyMatrix): SpeedyPromise<SpeedyMatrix>
    {
        /*

        We can probably get more accurate motion estimates if we
        work in 3D rather than in 2D. We're currently estimating
        an affine transform in image space. What if we projected
        the keypoints into world space, estimated the camera motion
        (rotation and translation) that best describes the observed
        observed motion of the keypoints, and then projected things
        back to image space? Need to figure this out; we'll get a
        homography matrix.

        Note: keypoints are in rectified image space.

        Note: work with a 6 DoF perspective transform instead of 8.

        */

        const model = Speedy.Matrix.Zeros(3);
        const n = preprocessedMatches.columns / 2; // number of preprocessed matches

        // find motion model
        return Speedy.Matrix.findHomography(
            model,
            preprocessedMatches.block(0,1,0,n-1),
            preprocessedMatches.block(0,1,n,2*n-1), {
            method: 'pransac',
            reprojectionError: TRACK_RANSAC_REPROJECTIONERROR,
            numberOfHypotheses: 512*2,
            bundleSize: 128*4, //*4
        }).then(_ => {

            // validate the model
            const a00 = model.at(0,0);
            if(Number.isNaN(a00))
                throw new TrackingError(`Can't compute perspective motion model: bad keypoints`);

            // done!
            return model;

        });
    }

    /**
     * Find a rectification matrix to be applied to the target image
     * @param homography maps a reference image to the AR screen
     * @param media target
     * @param screenSize AR screen
     * @returns promise that resolves to a rectification matrix
     */
    private _findImageWarp(homography: SpeedyMatrix, screenSize: SpeedySize): SpeedyPromise<SpeedyMatrix>
    {
        const referenceImage = this._referenceImage as ReferenceImage;
        const media = this._imageTracker.database._findMedia(referenceImage.name);
        const mat = Speedy.Matrix.Zeros(3);

        return this._findRectificationMatrixOfFullscreenImage(media, screenSize).then(warp =>
            mat.setTo(warp.times(homography.inverse()))
        );
    }

    /**
     * Find a warp to be applied to the keypoints
     * @returns affine transform
     */
    private _findKeypointWarp(): SpeedyPromise<SpeedyMatrix>
    {
        const referenceImage = this._referenceImage as ReferenceImage;
        const media = this._imageTracker.database._findMedia(referenceImage.name);
        const screenSize = this.screenSize;
        const sw = screenSize.width, sh = screenSize.height;
        const mat = Speedy.Matrix.Eye(3, 3);

        // no rotation is needed
        if(!this._mustRotateWarpedImage(media, screenSize))
            return Speedy.Promise.resolve(mat);

        // rotate by 90 degrees clockwise and scale
        return Speedy.Matrix.affine(
            mat.block(0,1,0,2),
            Speedy.Matrix(2, 3, [ 0,sh , 0,0 , sw,0  ]),
            Speedy.Matrix(2, 3, [ 0,0 , sw,0 , sw,sh ])
        ).then(_ => mat);
    }

    /**
     * Predict the keypoints without actually looking at the image
     * @param curr keypoints at time t (will modify the contents)
     * @param initial keypoints at time t-1 (not just t = 0)
     * @returns keypoints at time t+1
     */
    private _predictKeypoints(curr: SpeedyMatchedKeypoint[], initial: SpeedyKeypoint[]): SpeedyMatchedKeypoint[]
    {
        // the target image is likely to be moving roughly in
        // the same manner as it was in the previous frame
        const next: SpeedyMatchedKeypoint[] = [];
        const n = curr.length;

        for(let i = 0; i < n; i++) {
            const cur = curr[i];

            if(cur.matches[0].index < 0 || cur.matches[1].index < 0)
                continue;
            /*
            else if(cur.matches[0].distance > TRACK_MATCH_RATIO * cur.matches[1].distance)
                continue;
            */

            const ini = initial[cur.matches[0].index];
            const dx = cur.position.x - ini.position.x;
            const dy = cur.position.y - ini.position.y;

            // a better mathematical model is needed
            const alpha = 0.8; //0.2;
            cur.position.x = ini.position.x + alpha * dx;
            cur.position.y = ini.position.y + alpha * dy;
            next.push(cur);
        }

        // done!
        return next;
    }

    /**
     * Create & setup the pipeline
     * @returns pipeline
     */
    protected _createPipeline(): SpeedyPipeline
    {
        const pipeline = Speedy.Pipeline();

        const source = Speedy.Image.Source('source');
        const screen = Speedy.Transform.Resize('screen');
        const greyscale = Speedy.Filter.Greyscale();
        const imageRectifier = Speedy.Transform.PerspectiveWarp('imageRectifier');
        const nightvision = Speedy.Filter.Nightvision();
        const nightvisionMux = Speedy.Image.Multiplexer();
        const blur = Speedy.Filter.GaussianBlur();
        const detector = Speedy.Keypoint.Detector.Harris();
        const descriptor = Speedy.Keypoint.Descriptor.ORB();
        const matcher = Speedy.Keypoint.Matcher.BFKNN();
        const subpixel = Speedy.Keypoint.SubpixelRefiner();
        const denoiser = Speedy.Filter.GaussianBlur();
        const borderClipper = Speedy.Keypoint.BorderClipper('borderClipper');
        const clipper = Speedy.Keypoint.Clipper();
        const keypointRectifier = Speedy.Keypoint.Transformer('keypointRectifier');
        const keypointPortalSource = Speedy.Keypoint.Portal.Source('keypointPortalSource');
        const keypointSink = Speedy.Keypoint.SinkOfMatchedKeypoints('keypoints');
        const imageSink = Speedy.Image.Sink('image');

        source.media = null;
        screen.size = Speedy.Size(0,0);
        imageRectifier.transform = Speedy.Matrix.Eye(3);
        nightvision.gain = NIGHTVISION_GAIN;
        nightvision.offset = NIGHTVISION_OFFSET;
        nightvision.decay = NIGHTVISION_DECAY;
        nightvision.quality = NIGHTVISION_QUALITY;
        nightvisionMux.port = TRACK_WITH_NIGHTVISION ? 1 : 0; // 1 = enable nightvision
        blur.kernelSize = Speedy.Size(ORB_GAUSSIAN_KSIZE, ORB_GAUSSIAN_KSIZE);
        blur.sigma = Speedy.Vector2(ORB_GAUSSIAN_SIGMA, ORB_GAUSSIAN_SIGMA);
        denoiser.kernelSize = Speedy.Size(SUBPIXEL_GAUSSIAN_KSIZE, SUBPIXEL_GAUSSIAN_KSIZE);
        denoiser.sigma = Speedy.Vector2(SUBPIXEL_GAUSSIAN_SIGMA, SUBPIXEL_GAUSSIAN_SIGMA);
        detector.quality = TRACK_HARRIS_QUALITY;
        detector.capacity = TRACK_DETECTOR_CAPACITY;
        subpixel.method = SUBPIXEL_METHOD;
        clipper.size = TRACK_MAX_KEYPOINTS;
        borderClipper.imageSize = screen.size;
        borderClipper.borderSize = Speedy.Vector2(0,0);
        keypointRectifier.transform = Speedy.Matrix.Eye(3);
        matcher.k = 2;
        keypointPortalSource.source = null;
        keypointSink.turbo = USE_TURBO;

        // prepare input
        source.output().connectTo(screen.input());
        screen.output().connectTo(greyscale.input());

        // preprocess images
        greyscale.output().connectTo(imageRectifier.input());
        imageRectifier.output().connectTo(nightvisionMux.input('in0'));
        imageRectifier.output().connectTo(nightvision.input());
        nightvision.output().connectTo(nightvisionMux.input('in1'));

        // keypoint detection & clipping
        nightvisionMux.output().connectTo(detector.input());
        detector.output().connectTo(borderClipper.input());
        borderClipper.output().connectTo(clipper.input());

        // keypoint refinement
        imageRectifier.output().connectTo(denoiser.input());
        denoiser.output().connectTo(subpixel.input('image'));
        clipper.output().connectTo(subpixel.input('keypoints'));

        // keypoint description
        imageRectifier.output().connectTo(blur.input());
        blur.output().connectTo(descriptor.input('image'));
        subpixel.output().connectTo(descriptor.input('keypoints'));

        // keypoint matching
        keypointPortalSource.output().connectTo(matcher.input('database'));
        descriptor.output().connectTo(matcher.input('keypoints'));

        // prepare output
        descriptor.output().connectTo(keypointRectifier.input());
        //preMatcher.output().connectTo(keypointRectifier.input());
        keypointRectifier.output().connectTo(keypointSink.input());
        matcher.output().connectTo(keypointSink.input('matches'));
        //imageRectifier.output().connectTo(imageSink.input());

        // done!
        pipeline.init(
            source, screen, greyscale,
            imageRectifier, nightvision, nightvisionMux, blur,
            detector, subpixel, borderClipper, clipper, denoiser,
            descriptor, matcher,
            keypointPortalSource, keypointRectifier, keypointSink,
            //imageSink
        );
        return pipeline;
    }
}
