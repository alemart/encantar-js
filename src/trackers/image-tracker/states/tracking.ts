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
import { SpeedyMatrixExpr } from 'speedy-vision/types/core/speedy-matrix-expr';
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
import { ImageTrackerUtils, ImageTrackerKeypointPair } from '../image-tracker-utils';
import { ImageTrackerEvent } from '../image-tracker-event';
import { ImageTrackerState, ImageTrackerStateOutput } from './state';
import { Nullable, Utils } from '../../../utils/utils';
import { ReferenceImage, ReferenceImageWithMedia } from '../reference-image';
import { CameraModel } from '../../../geometry/camera-model';
import { Viewer } from '../../../geometry/viewer';
import { Pose } from '../../../geometry/pose';
import { Transform } from '../../../geometry/transform';
import { IllegalOperationError, IllegalArgumentError, TrackingError, NumericalError } from '../../../utils/errors';
import {
    TRACK_RECTIFIED_SCALE, TRACK_CLIPPING_BORDER, TRACK_MIN_MATCHES, TRACK_LOST_TOLERANCE,
    NIGHTVISION_GAIN, NIGHTVISION_OFFSET, NIGHTVISION_DECAY, TRACK_WITH_NIGHTVISION,
    ORB_GAUSSIAN_KSIZE, ORB_GAUSSIAN_SIGMA,
    SUBPIXEL_GAUSSIAN_KSIZE, SUBPIXEL_GAUSSIAN_SIGMA,
    TRACK_HARRIS_QUALITY, TRACK_DETECTOR_CAPACITY, TRACK_MAX_KEYPOINTS,
    TRACK_RANSAC_REPROJECTIONERROR_NDC, TRACK_MATCH_RATIO,
    NIGHTVISION_QUALITY, SUBPIXEL_METHOD,
} from '../settings';
import { Settings } from '../../../core/settings';

/** Whether or not we want to accelerate GPU-CPU transfers. Using turbo costs a slight delay on the tracking */
const USE_TURBO = true;

/** Number of PBOs; meaningful only when using turbo */
const NUMBER_OF_PBOS = 2;



/**
 * The tracking state of the Image Tracker tracks
 * keypoints of the image target and updates the
 * rectification matrix
 */
export class ImageTrackerTrackingState extends ImageTrackerState
{
    /** tracked image */
    private _referenceImage: Nullable<ReferenceImageWithMedia>;

    /** current homography (for warping) */
    private _warpHomography: SpeedyMatrix;

    /** current homography (for computing the pose) */
    private _poseHomography: SpeedyMatrix;

    /** initial keypoints (i.e., the keypoints we found when we first started tracking) */
    private _templateKeypoints: SpeedyKeypoint[];

    /** the screen size when the tracking began */
    private _initialScreenSize: SpeedySize;

    /** last output of the tracker */
    private _lastOutput: ImageTrackerOutput;

    /** last output of the pipeline */
    private _lastPipelineOutput: SpeedyPipelineOutput;

    /** a helper for frame skipping */
    private _skipCounter: number;

    /** a helper */
    private _counter: number;

    /** the number of consecutive frames in which we have lost the tracking */
    private _lostCounter: number;

    /** camera model linked to the tracked image */
    private _camera: CameraModel;

    /** a camera model that is fixed at the origin */
    private _fixedCamera: CameraModel;



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
        this._templateKeypoints = [];
        this._initialScreenSize = Speedy.Size(1, 1);
        this._lastOutput = {};
        this._lastPipelineOutput = { keypoints: [] };
        this._skipCounter = 0;
        this._counter = 0;
        this._lostCounter = 0;
        this._camera = new CameraModel();
        this._fixedCamera = new CameraModel();
    }

    /**
     * Called as soon as this becomes the active state, just before update() runs for the first time
     * @param settings
     */
    onEnterState(settings: Record<string,any>)
    {
        const homography = settings.homography as SpeedyMatrix; // NDC, from reference image to video
        const referenceImage = settings.referenceImage as Nullable<ReferenceImageWithMedia>;
        const templateKeypoints = settings.templateKeypoints as SpeedyKeypoint[];
        const templateKeypointPortalSink = settings.templateKeypointPortalSink as SpeedyPipelineNodeKeypointPortalSink;
        const initialScreenSize = settings.initialScreenSize as SpeedySize; // this.screenSize is not yet set
        const keypointPortalSource = this._pipeline.node('keypointPortalSource') as SpeedyPipelineNodeKeypointPortalSource;

        // this shouldn't happen
        if(!referenceImage)
            throw new IllegalOperationError(`Can't track a null reference image`);

        // set attributes
        this._referenceImage = referenceImage;
        this._warpHomography = Speedy.Matrix(homography);
        this._poseHomography = Speedy.Matrix(homography);
        this._templateKeypoints = templateKeypoints;
        this._initialScreenSize = Speedy.Size(initialScreenSize.width, initialScreenSize.height);
        this._lastOutput = {};
        this._lastPipelineOutput = { keypoints: [] };
        this._skipCounter = 0;
        this._counter = 0;
        this._lostCounter = 0;

        // setup portals
        keypointPortalSource.source = templateKeypointPortalSink;

        // setup the cameras
        const aspectRatio = initialScreenSize.width / initialScreenSize.height;
        this._camera.init(aspectRatio);
        this._fixedCamera.init(aspectRatio);

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
        // log
        Utils.log(`No longer tracking image "${this._referenceImage!.name}"!`);

        // release the cameras
        this._fixedCamera.release();
        this._camera.release();

        // emit event
        const ev = new ImageTrackerEvent('targetlost', this._referenceImage!);
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
        const keypointScaler = this._pipeline.node('keypointScaler') as SpeedyPipelineNodeKeypointTransformer;
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

        // convert keypoints to NIS
        keypointScaler.transform = ImageTrackerUtils.rasterToNIS(screenSize);

        // rectify the image
        const scale = TRACK_RECTIFIED_SCALE;
        const aspectRatio = ImageTrackerUtils.bestFitAspectRatioNDC(screenSize, this._referenceImage!);
        const shrink = ImageTrackerUtils.bestFitScaleNDC(aspectRatio, scale);
        const undistort = this._warpHomography.inverse();
        const toScreen = ImageTrackerUtils.NDCToRaster(screenSize);
        const toNDC = ImageTrackerUtils.rasterToNDC(screenSize);

        return imageRectifier.transform.setTo(
            toScreen.times(shrink.times(undistort)).times(toNDC)
        ).then(() => void 0);
    }

    /**
     * GPU processing
     * @returns promise with the pipeline results
     */
    protected _gpuUpdate(): SpeedyPromise<SpeedyPipelineOutput>
    {
        // Run the pipeline as usual
        if(!USE_TURBO || Settings.powerPreference == 'low-power')// || Settings.powerPreference == 'high-performance')
            return super._gpuUpdate();

        // When using turbo, we reduce the GPU usage by skipping every other frame
        if(0 == (this._skipCounter = 1 - this._skipCounter)) {
            const templateKeypoints = this._templateKeypoints;
            const previousKeypoints = this._lastPipelineOutput.keypoints as SpeedyMatchedKeypoint[];
            //const currentKeypoints = this._predictKeypoints(previousKeypoints, templateKeypoints);
            const currentKeypoints = previousKeypoints; // this actually works

            this._lastPipelineOutput.keypoints = currentKeypoints;

            return Speedy.Promise.resolve(this._lastPipelineOutput);
        }

        // Run the pipeline and store the results
        return super._gpuUpdate().then(result => {
            this._lastPipelineOutput = result;
            return result;
        });
    }

    /**
     * Post processing that takes place just after the GPU processing
     * @param result pipeline results
     * @returns state output
     */
    protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>
    {
        const keypoints = result.keypoints as SpeedyMatchedKeypoint[];
        const image = result.image as SpeedyMedia | undefined;
        const referenceImage = this._referenceImage!;
        const screenSize = this.screenSize;

        // track the target
        return Speedy.Promise.resolve()
        .then(() => {

            // if a change in screen size occurs, we need to recalibrate
            // (perform a new pre-training)
            if(!screenSize.equals(this._initialScreenSize))
                throw new TrackingError('Detected a change in screen size');

            // find matching pairs of keypoints
            const allPairs = this._findMatchingPairs(this._templateKeypoints, keypoints);
            const pairs = ImageTrackerUtils.refineMatchingPairs(allPairs);
            if(pairs.length < TRACK_MIN_MATCHES)
                throw new TrackingError('Not enough data points to continue the tracking');

            // find motion models
            const points = ImageTrackerUtils.compilePairsOfKeypointsNDC(pairs);
            return Speedy.Promise.all<SpeedyMatrixExpr>([
                this._findAffineMotionNDC(points),
                this._findPerspectiveMotionNDC(points)
            ]);

        })
        .then(([affineMotion, perspectiveMotion]) => {

            const lowPower = (Settings.powerPreference == 'low-power');
            const delay = NUMBER_OF_PBOS * (!lowPower ? 2 : 1);

            // update warp homography
            if(!USE_TURBO || this._counter % delay == 1) // skip the first frame (PBOs)
                this._warpHomography.setToSync(affineMotion.times(this._warpHomography));

            // update pose homography
            this._poseHomography.setToSync(perspectiveMotion.times(this._warpHomography));
            if(Number.isNaN(this._poseHomography.at(0,0)))
                throw new NumericalError('Bad homography'); // normalize? 1 / h33

            // update counter
            this._counter = (this._counter + 1) % delay;

            /*
            // test
            console.log("POSE ", this._poseHomography.toString());
            console.log("WARP ", this._warpHomography.toString());
            console.log("AMOT ", Speedy.Matrix(affineMotion).toString());
            console.log("PMOT ", Speedy.Matrix(perspectiveMotion).toString());
            */

            // We transform the keypoints of the reference image to NDC as a
            // convenience. However, doing so distorts the aspect ratio. Here
            // we undo the distortion.
            //const scale = ImageTrackerUtils.inverseBestFitScaleNDC(referenceImage.aspectRatio); // not preferred; extrapolates the bounds of NDC
            const scale = ImageTrackerUtils.bestFitScaleNDC(1 / referenceImage.aspectRatio); // preferred
            const homography = Speedy.Matrix(this._poseHomography.times(scale));
            //this._poseHomography = homography; // visualize the polyline becoming a square

            // update camera model
            return this._camera.update(homography);
        })
        .then(() => {

            /*

            Q: should the camera move relative to the target image, or should
               the target image move relative to the camera?

            A: the target image should move and the camera should stay fixed.
               Movements of the target image in the video should not affect the
               rendering of all virtual elements in world space. They should
               only affect the rendering of virtual elements positioned at the
               local space linked to the target ("ar.root").

               (that's right, and movements of the real camera in physical space
               shouldn't affect the world space either. Note: the real camera is
               expected to be shaky. Example: a user holding a mobile phone.)

            */

            // the target moves and the camera stays fixed at the origin
            const modelMatrix = this._camera.computeViewMatrix(); // p_view = V M p_model
            const transform = new Transform(modelMatrix);
            const pose = new Pose(transform);
            const viewer = new Viewer(this._fixedCamera); // view matrix = I

            /*
            // this is the opposite reasoning: the camera moves and the target
            // image stays fixed at the origin of world space
            const modelMatrix = Speedy.Matrix.Eye(4);
            const transform = new Transform(modelMatrix);
            const pose = new Pose(transform);
            const viewer = new Viewer(this._camera);
            */

            // the trackable object
            const trackable: TrackableImage = {
                pose: pose,
                referenceImage: referenceImage,
                tracker: this._imageTracker
            };

            // the result generated by the image tracker
            const result: ImageTrackerResult = {
                tracker: this._imageTracker,
                trackables: [ trackable ],
                viewer: viewer
            };

            // tracker output
            const trackerOutput: ImageTrackerOutput = {
                exports: result,
                keypoints: keypoints,
                //keypointsNIS: image !== undefined ? keypoints : undefined, // debug only
                image: image,
                polylineNDC: ImageTrackerUtils.findPolylineNDC(this._poseHomography),
                camera: this._camera,
            };

            // save the last output
            this._lastOutput = trackerOutput;

            // we have successfully tracked the target in this frame
            this._lostCounter = 0;

            // done!
            return {
                nextState: 'tracking',
                trackerOutput: trackerOutput
            };

        })
        .catch(err => {

            // give some tolerance to tracking errors
            if(err instanceof TrackingError) {
                if(++this._lostCounter <= TRACK_LOST_TOLERANCE) {
                    return {
                        nextState: 'tracking',
                        trackerOutput: this._lastOutput
                    };
                }
            }

            // log
            Utils.warning(`The target has been lost! ${err.toString()}`);

            // go back to the scanning state
            return {
                nextState: 'scanning',
                trackerOutput: { }
            };

        });
    }

    /**
     * Find an affine motion model in NDC between pairs of keypoints in NDC
     * given as a 2 x 2n [ src | dest ] matrix
     * @param points compiled pairs of keypoints in NDC
     * @returns a promise that resolves to a 3x3 warp in NDC that maps source to destination
     */
    private _findAffineMotionNDC(points: SpeedyMatrix): SpeedyPromise<SpeedyMatrixExpr>
    {
        /*

        We can probably get more accurate motion estimates if we
        work in 3D rather than in 2D. We're currently estimating an
        affine motion in 2D NDC space, which does not account for
        perspective distortions. What if we projected the keypoints
        into 3D NDC space, estimated the camera motion (rotation and
        translation) that best describes the observed observed motion
        of the keypoints, and then projected things back to 2D NDC
        space? Need to figure this out; we'll get a homography matrix.

        Note: work with a 6 DoF perspective transform instead of 8.

        */

        return ImageTrackerUtils.findAffineWarpNDC(points, {
            method: 'pransac',
            reprojectionError: TRACK_RANSAC_REPROJECTIONERROR_NDC,
            numberOfHypotheses: 512*2,
            bundleSize: 128,
            mask: undefined // score is not needed
        }).then(([ warp, score ]) => {

            const scale = TRACK_RECTIFIED_SCALE;
            const aspectRatio = ImageTrackerUtils.bestFitAspectRatioNDC(this.screenSize, this._referenceImage!);
            const shrink = ImageTrackerUtils.bestFitScaleNDC(aspectRatio, scale);
            const grow = ImageTrackerUtils.inverseBestFitScaleNDC(aspectRatio, scale);
            const scaledWarp = grow.times(warp).times(shrink);

            const distort = this._warpHomography;
            const undistort = distort.inverse();
            const correctedWarp = distort.times(scaledWarp).times(undistort);

            return correctedWarp;

        }).catch(err => {

            throw new TrackingError(`Can't find an affine motion`, err);

        });
    }

    /**
     * Find a perspective motion model in NDC between pairs of keypoints in NDC
     * given as a 2 x 2n [ src | dest ] matrix
     * @param points compiled pairs of keypoints in NDC
     * @returns a promise that resolves to a 3x3 warp in NDC that maps source to destination
     */
    private _findPerspectiveMotionNDC(points: SpeedyMatrix): SpeedyPromise<SpeedyMatrixExpr>
    {
        return ImageTrackerUtils.findPerspectiveWarpNDC(points, {
            method: 'pransac',
            reprojectionError: TRACK_RANSAC_REPROJECTIONERROR_NDC,
            numberOfHypotheses: 512*2,
            bundleSize: 128,//128*4,
            mask: undefined // score is not needed
        }).then(([ warp, score ]) => {

            const scale = TRACK_RECTIFIED_SCALE;
            const aspectRatio = ImageTrackerUtils.bestFitAspectRatioNDC(this.screenSize, this._referenceImage!);
            const shrink = ImageTrackerUtils.bestFitScaleNDC(aspectRatio, scale);
            const grow = ImageTrackerUtils.inverseBestFitScaleNDC(aspectRatio, scale);
            const scaledWarp = grow.times(warp).times(shrink);

            const distort = this._poseHomography;
            const undistort = distort.inverse();
            const correctedWarp = distort.times(scaledWarp).times(undistort);

            return correctedWarp;

        }).catch(err => {

            throw new TrackingError(`Can't find a perspective motion`, err);

        });
    }

    /**
     * Find matching pairs of two sets of keypoints matched via brute force
     * @param srcKeypoints source (database)
     * @param destKeypoints destination
     * @returns an array of matching pairs [src, dest]
     */
    private _findMatchingPairs(srcKeypoints: SpeedyKeypoint[], destKeypoints: SpeedyMatchedKeypoint[]): ImageTrackerKeypointPair[]
    {
        const pairs: ImageTrackerKeypointPair[] = [];

        for(let i = 0; i < destKeypoints.length; i++) {
            const destKeypoint = destKeypoints[i];

            if(destKeypoint.matches[0].index >= 0 && destKeypoint.matches[1].index >= 0) {
                const d1 = destKeypoint.matches[0].distance;
                const d2 = destKeypoint.matches[1].distance;

                // the best match should be "much better" than the second best match,
                // which means that they are "distinct enough"
                if(d1 <= TRACK_MATCH_RATIO * d2) {
                    const srcKeypoint = srcKeypoints[destKeypoint.matches[0].index];
                    pairs.push([srcKeypoint, destKeypoint]);
                }
            }
        }

        return pairs;
    }

    /**
     * Predict the keypoints without actually looking at the image
     * @param curr keypoints at time t (will modify the contents)
     * @param prev keypoints at time t-1 (not just t = 0)
     * @returns keypoints at time t+1
     */
    /*
    private _predictKeypoints(curr: SpeedyMatchedKeypoint[], prev: SpeedyKeypoint[]): SpeedyMatchedKeypoint[]
    {
        // the target image is likely to be moving roughly in
        // the same manner as it was in the previous frame
        const alpha = 0.8; //0.2;
        const next: SpeedyMatchedKeypoint[] = [];
        const n = curr.length;

        for(let i = 0; i < n; i++) {
            const cur = curr[i];

            if(cur.matches[0].index < 0 || cur.matches[1].index < 0)
                continue;
            //else if(cur.matches[0].distance > TRACK_MATCH_RATIO * cur.matches[1].distance)
            //    continue;

            const prv = prev[cur.matches[0].index];
            const dx = cur.position.x - prv.position.x;
            const dy = cur.position.y - prv.position.y;

            // a better mathematical model is needed
            cur.position.x = prv.position.x + alpha * dx;
            cur.position.y = prv.position.y + alpha * dy;
            next.push(cur);
        }

        // done!
        return next;
    }
    */

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
        const keypointScaler = Speedy.Keypoint.Transformer('keypointScaler');
        const keypointPortalSource = Speedy.Keypoint.Portal.Source('keypointPortalSource');
        const keypointSink = Speedy.Keypoint.SinkOfMatchedKeypoints('keypoints');
        //const imageSink = Speedy.Image.Sink('image');

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
        keypointScaler.transform = Speedy.Matrix.Eye(3);
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
        descriptor.output().connectTo(keypointScaler.input());
        keypointScaler.output().connectTo(keypointSink.input());
        matcher.output().connectTo(keypointSink.input('matches'));
        //imageRectifier.output().connectTo(imageSink.input());

        // done!
        pipeline.init(
            source, screen, greyscale,
            imageRectifier, nightvision, nightvisionMux, blur,
            detector, subpixel, borderClipper, clipper, denoiser,
            descriptor, matcher,
            keypointPortalSource, keypointScaler, keypointSink,
            //imageSink
        );

        return pipeline;
    }
}
