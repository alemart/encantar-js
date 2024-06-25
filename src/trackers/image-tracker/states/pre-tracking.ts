/*
 * MARTINS.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022  Alexandre Martins <alemartf(at)gmail.com>
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
 * pre-tracking.ts
 * Pre-tracking state of the Image Tracker
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyPoint2 } from 'speedy-vision/types/core/speedy-point';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
import { SpeedyPipelineNodeImageSource } from 'speedy-vision/types/core/pipeline/nodes/images/source';
import { SpeedyPipelineNodeImageMultiplexer } from 'speedy-vision/types/core/pipeline/nodes/images/multiplexer';
import { SpeedyPipelineNodeImagePortalSource, SpeedyPipelineNodeImagePortalSink } from 'speedy-vision/types/core/pipeline/nodes/images/portal';
import { SpeedyPipelineNodeKeypointPortalSource, SpeedyPipelineNodeKeypointPortalSink } from 'speedy-vision/types/core/pipeline/nodes/keypoints/portal';
import { SpeedyPipelineNodeResize } from 'speedy-vision/types/core/pipeline/nodes/transforms/resize';
import { SpeedyPipelineNodePerspectiveWarp } from 'speedy-vision/types/core/pipeline/nodes/transforms/perspective-warp';
import { SpeedyPipelineNodeKeypointBorderClipper } from 'speedy-vision/types/core/pipeline/nodes/keypoints/border-clipper';
import { SpeedyPipelineNodeKeypointTransformer } from 'speedy-vision/types/core/pipeline/nodes/keypoints/transformer';
import { SpeedyPipelineNodeKeypointMultiplexer } from 'speedy-vision/types/core/pipeline/nodes/keypoints/multiplexer';
import { SpeedyPipelineNodeKeypointBuffer } from 'speedy-vision/types/core/pipeline/nodes/keypoints/buffer';
import { SpeedyPipelineNodeStaticLSHTables } from 'speedy-vision/types/core/pipeline/nodes/keypoints/matchers/lsh-static-tables';
import { SpeedyKeypoint, SpeedyMatchedKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
import { ImageTracker, ImageTrackerOutput, ImageTrackerStateName } from '../image-tracker';
import { ImageTrackerTrackingState } from './tracking';
import { ImageTrackerState, ImageTrackerStateOutput } from './state';
import { Nullable, Utils } from '../../../utils/utils';
import { IllegalOperationError, TrackingError } from '../../../utils/errors';
import { ReferenceImage } from '../reference-image';
import {
    TRACK_RECTIFIED_BORDER, TRACK_CLIPPING_BORDER, TRACK_REFINEMENT_ITERATIONS,
    NIGHTVISION_GAIN, NIGHTVISION_OFFSET, NIGHTVISION_DECAY, TRACK_WITH_NIGHTVISION,
    ORB_GAUSSIAN_KSIZE, ORB_GAUSSIAN_SIGMA,
    TRACK_HARRIS_QUALITY, TRACK_DETECTOR_CAPACITY, TRACK_MAX_KEYPOINTS,
    SUBPIXEL_GAUSSIAN_KSIZE, SUBPIXEL_GAUSSIAN_SIGMA,
    TRACK_RANSAC_REPROJECTIONERROR,
    TRAIN_TARGET_NORMALIZED_SIZE,
    TRACK_MATCH_RATIO,
    NIGHTVISION_QUALITY,
    SUBPIXEL_METHOD,
} from '../settings';


/** The pre-tracking follows a fixed sequence of steps */
type PreTrackingStep = 'read-reference-image' | 'warp-camera-image' | 'train-camera-image';

/** Default target space size (used when training) */
const DEFAULT_TARGET_SPACE_SIZE = Speedy.Size(TRAIN_TARGET_NORMALIZED_SIZE, TRAIN_TARGET_NORMALIZED_SIZE);

/** Use the camera stream as the input of the pipeline */
const PORT_CAMERA_IMAGE = 1;

/** Use the reference image as the input of the pipeline */
const PORT_REFERENCE_IMAGE = 0;



/**
 * The pre-tracking state of the Image Tracker is a new training
 * phase for the particular, actual target we'll be tracking
 */
export class ImageTrackerPreTrackingState extends ImageTrackerState
{
    /** reference image */
    private _referenceImage: Nullable<ReferenceImage>;

    /** initial homography mapping the target image space to the AR screen space */
    private _homography: SpeedyMatrix;

    /** current step */
    private _step: PreTrackingStep;

    /** stored keypoints of the reference image */
    private _referenceKeypoints: SpeedyKeypoint[];

    /** current number of iterations for warp refinement */
    private _iterations: number;



    /**
     * Constructor
     * @param imageTracker
     */
    constructor(imageTracker: ImageTracker)
    {
        super('pre-tracking', imageTracker);

        this._homography = Speedy.Matrix.Eye(3);
        this._referenceImage = null;
        this._step = 'read-reference-image';
        this._referenceKeypoints = [];
        this._iterations = 0;
    }

    /**
     * Called as soon as this becomes the active state, just before update() runs for the first time
     * @param settings
     */
    onEnterState(settings: Record<string,any>)
    {
        const imagePortalSource = this._pipeline.node('imagePortalSource') as SpeedyPipelineNodeImagePortalSource;
        const muxOfReferenceKeypoints = this._pipeline.node('muxOfReferenceKeypoints') as SpeedyPipelineNodeKeypointMultiplexer;
        const muxOfBufferOfReferenceKeypoints = this._pipeline.node('muxOfBufferOfReferenceKeypoints') as SpeedyPipelineNodeKeypointMultiplexer;
        const bufferOfReferenceKeypoints = this._pipeline.node('bufferOfReferenceKeypoints') as SpeedyPipelineNodeKeypointBuffer;
        const homography = settings.homography as SpeedyMatrix;
        const referenceImage = settings.referenceImage as Nullable<ReferenceImage>;
        const snapshot = settings.snapshot as SpeedyPipelineNodeImagePortalSink;

        // this shouldn't happen
        if(!referenceImage)
            throw new TrackingError(`Can't track a null reference image`);

        // set attributes
        this._homography = homography;
        this._referenceImage = referenceImage;
        this._step = 'read-reference-image';
        this._referenceKeypoints = [];
        this._iterations = 0;

        // setup the pipeline
        imagePortalSource.source = snapshot;
        muxOfReferenceKeypoints.port = 0;
        muxOfBufferOfReferenceKeypoints.port = 0;
        bufferOfReferenceKeypoints.frozen = false;
    }

    /**
     * Called just before the GPU processing
     * @returns promise
     */
    protected _beforeUpdate(): SpeedyPromise<void>
    {
        const referenceImage = this._referenceImage as ReferenceImage;
        const source = this._pipeline.node('source') as SpeedyPipelineNodeImageSource;
        const sourceMux = this._pipeline.node('sourceMux') as SpeedyPipelineNodeImageMultiplexer;
        const imageRectifier = this._pipeline.node('imageRectifier') as SpeedyPipelineNodePerspectiveWarp;
        const keypointRectifier = this._pipeline.node('keypointRectifier') as SpeedyPipelineNodeKeypointTransformer;
        const borderClipper = this._pipeline.node('borderClipper') as SpeedyPipelineNodeKeypointBorderClipper;
        const screenSize = this.screenSize;

        // set the source media to the reference image we're going to track
        const targetMedia = this._imageTracker.database._findMedia(referenceImage.name);
        source.media = targetMedia;

        // setup the source multiplexer
        if(this._step == 'read-reference-image')
            sourceMux.port = PORT_REFERENCE_IMAGE;
        else
            sourceMux.port = PORT_CAMERA_IMAGE;

        // clip keypoints from the borders of the target image
        borderClipper.imageSize = screenSize;
        borderClipper.borderSize = Speedy.Vector2(
            screenSize.width * TRACK_CLIPPING_BORDER,
            screenSize.height * TRACK_CLIPPING_BORDER
        );

        // rectify the image
        const rectify = (this._step == 'read-reference-image') ?
            this._findRectificationMatrixOfFullscreenImage(targetMedia, screenSize) :
            this._findRectificationMatrixOfCameraImage(this._homography, DEFAULT_TARGET_SPACE_SIZE, targetMedia, screenSize);

        return rectify.then(rectificationMatrix => {
            imageRectifier.transform = rectificationMatrix;
        });
    }

    /**
     * Post processing that takes place just after the GPU processing
     * @param result pipeline results
     * @returns state output
     */
    protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>
    {
        const referenceImage = this._referenceImage as ReferenceImage;
        const imagePortalSink = this._pipeline.node('imagePortal') as SpeedyPipelineNodeImagePortalSink;
        const keypointPortalSink = this._pipeline.node('keypointPortalSink') as SpeedyPipelineNodeKeypointPortalSink;
        const muxOfReferenceKeypoints = this._pipeline.node('muxOfReferenceKeypoints') as SpeedyPipelineNodeKeypointMultiplexer;
        const muxOfBufferOfReferenceKeypoints = this._pipeline.node('muxOfBufferOfReferenceKeypoints') as SpeedyPipelineNodeKeypointMultiplexer;
        const bufferOfReferenceKeypoints = this._pipeline.node('bufferOfReferenceKeypoints') as SpeedyPipelineNodeKeypointBuffer;
        const keypoints = result.keypoints as SpeedyMatchedKeypoint[];
        const image = result.image as SpeedyMedia | undefined;

        // tracker output
        const trackerOutput: ImageTrackerOutput = {
            keypoints: image !== undefined ? keypoints : undefined, // debug only
            image: image,
            screenSize: this.screenSize,
        };

        // decide what to do next
        switch(this._step) {
            case 'read-reference-image': {
                // enable matching
                muxOfReferenceKeypoints.port = 1;

                // store reference keypoints
                this._referenceKeypoints = keypoints;

                // next step
                this._step = 'warp-camera-image';
                return Speedy.Promise.resolve({
                    nextState: 'pre-tracking',
                    trackerOutput: trackerOutput,
                });
            }

            case 'warp-camera-image': {
                // freeze reference keypoints
                bufferOfReferenceKeypoints.frozen = true;
                muxOfBufferOfReferenceKeypoints.port = 1;

                // refine warp?
                if(++this._iterations < TRACK_REFINEMENT_ITERATIONS)
                    this._step = 'warp-camera-image';
                else
                    this._step = 'train-camera-image';

                // warp image & go to next step
                return this._findWarp(keypoints, this._referenceKeypoints).then(warp =>
                    this._homography.setTo(this._homography.times(warp))
                ).then(_ => ({
                    nextState: 'pre-tracking',
                    trackerOutput: trackerOutput,
                })).catch(err => {
                    Utils.warning(`Can't pre-track target image "${referenceImage.name}". ${err.toString()}`);
                    return {
                        nextState: 'scanning',
                        trackerOutput: trackerOutput,
                    };
                });
            }

            case 'train-camera-image': {
                // log
                Utils.log(`Took a snapshot of target image "${referenceImage.name}". Found ${keypoints.length} keypoints.`);

                // change the coordinates
                return this._changeSpace(this._homography, this.screenSize).then(homography => {

                    // we're ready to track the target!
                    return Speedy.Promise.resolve({
                        //nextState: 'pre-tracking',
                        nextState: 'tracking',
                        trackerOutput: trackerOutput,
                        nextStateSettings: {
                            homography: homography,
                            referenceImage: referenceImage,
                            templateKeypoints: keypoints,
                            keypointPortalSink: keypointPortalSink,
                            imagePortalSink: imagePortalSink,
                            screenSize: this.screenSize,
                        },
                    });

                });
            }
        }
    }

    /**
     * Find an adjustment warp between the camera image and the reference image
     * @param dstKeypoints destination
     * @param srcKeypoints source
     * @returns a promise that resolves to a 3x3 homography
     */
    private _findWarp(dstKeypoints: SpeedyMatchedKeypoint[], srcKeypoints: SpeedyKeypoint[]): SpeedyPromise<SpeedyMatrix>
    {
        //return Speedy.Promise.resolve(Speedy.Matrix.Eye(3));
        const srcCoords: number[] = [];
        const dstCoords: number[] = [];

        // find matching coordinates of the keypoints
        for(let i = 0; i < dstKeypoints.length; i++) {
            const dstKeypoint = dstKeypoints[i];
            if(dstKeypoint.matches[0].index >= 0 && dstKeypoint.matches[1].index >= 0) {
                const d1 = dstKeypoint.matches[0].distance, d2 = dstKeypoint.matches[1].distance;

                // the best match should be "much better" than the second best match,
                // which means that they are "distinct enough"
                if(d1 <= TRACK_MATCH_RATIO * d2) {
                    const srcKeypoint = srcKeypoints[dstKeypoint.matches[0].index];
                    srcCoords.push(srcKeypoint.x);
                    srcCoords.push(srcKeypoint.y);
                    dstCoords.push(dstKeypoint.x);
                    dstCoords.push(dstKeypoint.y);
                }
            }
        }

        // too few points?
        const n = srcCoords.length / 2;
        if(n < 4) {
            return Speedy.Promise.reject(
                new TrackingError('Too few points to compute a warp')
            );
        }

        // compute warp
        const model = Speedy.Matrix.Eye(3);
        return this._findKeypointWarp().then(transform =>

            // rectify keypoints
            Speedy.Matrix.applyAffineTransform(
                Speedy.Matrix.Zeros(2, 2*n),
                Speedy.Matrix(2, 2*n, srcCoords.concat(dstCoords)),
                transform.block(0,1,0,2)
            )

        ).then(points =>

            // find warp
            Speedy.Matrix.findAffineTransform(
                model.block(0,1,0,2),
                points.block(0,1,0,n-1),
                points.block(0,1,n,2*n-1), {
                method: 'pransac',
                reprojectionError: TRACK_RANSAC_REPROJECTIONERROR,
                numberOfHypotheses: 512*4,
                bundleSize: 128,
            })

        ).then(_ => {

            // validate the model
            const a00 = model.at(0,0);
            if(Number.isNaN(a00))
                throw new TrackingError(`Can't compute warp: bad keypoints`);

            // done!
            return model;

        });
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

        // no rotation is needed
        if(!this._mustRotateWarpedImage(media, screenSize))
            return Speedy.Promise.resolve(Speedy.Matrix.Eye(3));

        // rotate by 90 degrees clockwise around the pivot
        const px = screenSize.width / 2, py = screenSize.height / 2; // pivot
        return Speedy.Promise.resolve(Speedy.Matrix(3, 3, [
            0, 1, 0,
            -1, 0, 0,
            py+px, py-px, 1,
        ]));
    }

    /**
     * Change the space of the homography in order to improve tracking quality
     * @param homography mapping coordinates from normalized target space to AR screen space
     * @param screenSize AR screen size
     * @returns homography mapping coordinates from AR screen space to AR screen space
     */
    private _changeSpace(homography: SpeedyMatrix, screenSize: SpeedySize): SpeedyPromise<SpeedyMatrix>
    {
        const sw = screenSize.width, sh = screenSize.height;
        const screen = Speedy.Matrix(2, 4, [ 0, 0, sw, 0, sw, sh, 0, sh ]);

        const mat = Speedy.Matrix.Zeros(3);
        return this._findPolylineCoordinates(homography, DEFAULT_TARGET_SPACE_SIZE).then(polyline =>
            Speedy.Matrix.perspective(mat, screen, polyline)
        );
    }

    /**
     * Create & setup the pipeline
     * @returns pipeline
     */
    protected _createPipeline(): SpeedyPipeline
    {
        const pipeline = Speedy.Pipeline();

        const source = Speedy.Image.Source('source');
        const imagePortalSource = Speedy.Image.Portal.Source('imagePortalSource');
        const sourceMux = Speedy.Image.Multiplexer('sourceMux');
        const screen = Speedy.Transform.Resize('screen');
        const greyscale = Speedy.Filter.Greyscale();
        const imageRectifier = Speedy.Transform.PerspectiveWarp('imageRectifier');
        const nightvision = Speedy.Filter.Nightvision();
        const nightvisionMux = Speedy.Image.Multiplexer();
        const detector = Speedy.Keypoint.Detector.Harris();
        const descriptor = Speedy.Keypoint.Descriptor.ORB();
        const blur = Speedy.Filter.GaussianBlur();
        const clipper = Speedy.Keypoint.Clipper();
        const borderClipper = Speedy.Keypoint.BorderClipper('borderClipper');
        const denoiser = Speedy.Filter.GaussianBlur();
        const subpixel = Speedy.Keypoint.SubpixelRefiner();
        const matcher = Speedy.Keypoint.Matcher.BFKNN();
        const keypointRectifier = Speedy.Keypoint.Transformer('keypointRectifier');
        const keypointPortalSink = Speedy.Keypoint.Portal.Sink('keypointPortalSink');
        const keypointPortalSource = Speedy.Keypoint.Portal.Source('keypointPortalSource');
        const muxOfReferenceKeypoints = Speedy.Keypoint.Multiplexer('muxOfReferenceKeypoints');
        const bufferOfReferenceKeypoints = Speedy.Keypoint.Buffer('bufferOfReferenceKeypoints');
        const muxOfBufferOfReferenceKeypoints = Speedy.Keypoint.Multiplexer('muxOfBufferOfReferenceKeypoints');
        const keypointSink = Speedy.Keypoint.SinkOfMatchedKeypoints('keypoints');
        const imageSink = Speedy.Image.Sink('image');

        source.media = null;
        screen.size = Speedy.Size(0,0);
        imagePortalSource.source = null;
        imageRectifier.transform = Speedy.Matrix.Eye(3);
        sourceMux.port = PORT_REFERENCE_IMAGE;
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
        matcher.k = 2;
        keypointRectifier.transform = Speedy.Matrix.Eye(3);
        keypointPortalSource.source = keypointPortalSink;
        muxOfReferenceKeypoints.port = 0;
        muxOfBufferOfReferenceKeypoints.port = 0;
        bufferOfReferenceKeypoints.frozen = false;
        keypointSink.turbo = false;

        // prepare input
        source.output().connectTo(sourceMux.input('in0')); // port 0: reference image
        imagePortalSource.output().connectTo(sourceMux.input('in1')); // port 1: camera image (via portal)
        sourceMux.output().connectTo(screen.input());
        screen.output().connectTo(greyscale.input());

        // preprocess images
        greyscale.output().connectTo(imageRectifier.input());
        imageRectifier.output().connectTo(nightvisionMux.input('in0'));
        imageRectifier.output().connectTo(nightvision.input());
        nightvision.output().connectTo(nightvisionMux.input('in1'));
        nightvisionMux.output().connectTo(blur.input());

        // keypoint detection & clipping
        nightvisionMux.output().connectTo(detector.input());
        detector.output().connectTo(borderClipper.input());
        borderClipper.output().connectTo(clipper.input());

        // keypoint refinement
        imageRectifier.output().connectTo(denoiser.input());
        denoiser.output().connectTo(subpixel.input('image'));
        clipper.output().connectTo(subpixel.input('keypoints'));

        // keypoint description
        blur.output().connectTo(descriptor.input('image'));
        subpixel.output().connectTo(descriptor.input('keypoints'));

        // keypoint matching
        descriptor.output().connectTo(muxOfReferenceKeypoints.input('in0'));
        muxOfBufferOfReferenceKeypoints.output().connectTo(muxOfReferenceKeypoints.input('in1'));
        muxOfReferenceKeypoints.output().connectTo(matcher.input('database'));
        descriptor.output().connectTo(matcher.input('keypoints'));

        // store reference keypoints
        keypointPortalSource.output().connectTo(muxOfBufferOfReferenceKeypoints.input('in0'));
        bufferOfReferenceKeypoints.output().connectTo(muxOfBufferOfReferenceKeypoints.input('in1'));
        keypointPortalSource.output().connectTo(bufferOfReferenceKeypoints.input());

        // portals
        descriptor.output().connectTo(keypointPortalSink.input());

        // prepare output
        descriptor.output().connectTo(keypointRectifier.input());
        keypointRectifier.output().connectTo(keypointSink.input());
        matcher.output().connectTo(keypointSink.input('matches'));
        //imageRectifier.output().connectTo(imageSink.input());

        // done!
        pipeline.init(
            source, imagePortalSource, sourceMux, screen,
            greyscale, imageRectifier, nightvision, nightvisionMux, blur,
            detector, subpixel, clipper, borderClipper, denoiser, descriptor,
            keypointPortalSource, muxOfReferenceKeypoints, matcher,
            bufferOfReferenceKeypoints, muxOfBufferOfReferenceKeypoints,
            keypointRectifier, keypointSink,
            keypointPortalSink,
            //imageSink
        );

        return pipeline;
    }
}