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
 * pre-tracking-b.ts
 * Image tracker: Pre-Tracking B state
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { SpeedyMatrixExpr } from 'speedy-vision/types/core/speedy-matrix-expr';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
import { SpeedyPipelineNodeImageSource } from 'speedy-vision/types/core/pipeline/nodes/images/source';
import { SpeedyPipelineNodeImageMultiplexer } from 'speedy-vision/types/core/pipeline/nodes/images/multiplexer';
import { SpeedyPipelineNodeImageBuffer } from 'speedy-vision/types/core/pipeline/nodes/images/buffer';
import { SpeedyPipelineNodeImagePortalSource, SpeedyPipelineNodeImagePortalSink } from 'speedy-vision/types/core/pipeline/nodes/images/portal';
import { SpeedyPipelineNodeKeypointPortalSource, SpeedyPipelineNodeKeypointPortalSink } from 'speedy-vision/types/core/pipeline/nodes/keypoints/portal';
import { SpeedyPipelineNodeResize } from 'speedy-vision/types/core/pipeline/nodes/transforms/resize';
import { SpeedyPipelineNodePerspectiveWarp } from 'speedy-vision/types/core/pipeline/nodes/transforms/perspective-warp';
import { SpeedyPipelineNodeKeypointBorderClipper } from 'speedy-vision/types/core/pipeline/nodes/keypoints/border-clipper';
import { SpeedyPipelineNodeKeypointTransformer } from 'speedy-vision/types/core/pipeline/nodes/keypoints/transformer';
import { SpeedyKeypoint, SpeedyMatchedKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
import { ImageTracker, ImageTrackerOutput, ImageTrackerStateName } from '../image-tracker';
import { ImageTrackerUtils, ImageTrackerKeypointPair } from '../image-tracker-utils';
import { ImageTrackerState, ImageTrackerStateOutput } from './state';
import { ReferenceImageWithMedia } from '../reference-image';
import { Nullable, Utils } from '../../../utils/utils';
import { TrackingError } from '../../../utils/errors';
import {
    TRACK_RECTIFIED_SCALE, TRACK_CLIPPING_BORDER,
    NIGHTVISION_GAIN, NIGHTVISION_OFFSET, NIGHTVISION_DECAY, TRACK_WITH_NIGHTVISION,
    ORB_GAUSSIAN_KSIZE, ORB_GAUSSIAN_SIGMA,
    TRACK_HARRIS_QUALITY, TRACK_DETECTOR_CAPACITY, TRACK_MAX_KEYPOINTS,
    SUBPIXEL_GAUSSIAN_KSIZE, SUBPIXEL_GAUSSIAN_SIGMA,
    PRE_TRACK_MIN_MATCHES, PRE_TRACK_MAX_ITERATIONS,
    PRE_TRACK_MATCH_RATIO, PRE_TRACK_RANSAC_REPROJECTIONERROR_NDC,
    PRE_TRACK_FILTER_ALPHA, PRE_TRACK_FILTER_BETA,
    NIGHTVISION_QUALITY,
    SUBPIXEL_METHOD,
} from '../settings';

/** Port of the source image multiplexer: get data from the portal */
const PORT_PORTAL = 0;

/** Port of the source image multiplexer: get data from the camera */
const PORT_CAMERA = 1;




/**
 * In Pre-Tracking B, we refine the homography obtained at the scanning state.
 * We find a transformation that warps the snapshot obtained from the scanning
 * state to an image that closely resembles the output of Pre-Tracking A.
 */
export class ImageTrackerPreTrackingBState extends ImageTrackerState
{
    /** reference image */
    private _referenceImage: Nullable<ReferenceImageWithMedia>;

    /** a snapshot of the video from the scanning state and corresponding to the initial homography */
    private _snapshot: Nullable<SpeedyPipelineNodeImagePortalSink>;

    /** initial homography, from reference image to scanned image, NDC */
    private _homography: SpeedyMatrix;

    /** portal with keypoints from Pre-Tracking A */
    private _referenceKeypointPortalSink: Nullable<SpeedyPipelineNodeKeypointPortalSink>;

    /** number of iterations */
    private _iterations: number;






    /**
     * Constructor
     * @param imageTracker
     */
    constructor(imageTracker: ImageTracker)
    {
        super('pre-tracking-b', imageTracker);

        this._homography = Speedy.Matrix.Eye(3);
        this._referenceImage = null;
        this._snapshot = null;
        this._referenceKeypointPortalSink = null;
        this._iterations = 0;
    }

    /**
     * Called as soon as this becomes the active state, just before update() runs for the first time
     * @param settings
     */
    onEnterState(settings: Record<string,any>)
    {
        const homography = settings.homography as SpeedyMatrix;
        const referenceImage = settings.referenceImage as ReferenceImageWithMedia;
        const snapshot = settings.snapshot as SpeedyPipelineNodeImagePortalSink;
        const referenceKeypointPortalSink = settings.referenceKeypointPortalSink as SpeedyPipelineNodeKeypointPortalSink;
        const sourceMux = this._pipeline.node('sourceMux') as SpeedyPipelineNodeImageMultiplexer;
        const sourceBuffer = this._pipeline.node('sourceBuffer') as SpeedyPipelineNodeImageBuffer;

        // set attributes
        this._homography = homography;
        this._referenceImage = referenceImage;
        this._snapshot = snapshot;
        this._referenceKeypointPortalSink = referenceKeypointPortalSink;
        this._iterations = 0;

        // reset nodes
        sourceMux.port = PORT_PORTAL;
        sourceBuffer.frozen = false;
    }

    /**
     * Called just before the GPU processing
     * @returns promise
     */
    protected _beforeUpdate(): SpeedyPromise<void>
    {
        const screenSize = this.screenSize;
        const imageRectifier = this._pipeline.node('imageRectifier') as SpeedyPipelineNodePerspectiveWarp;
        const keypointScaler = this._pipeline.node('keypointScaler') as SpeedyPipelineNodeKeypointTransformer;
        const borderClipper = this._pipeline.node('borderClipper') as SpeedyPipelineNodeKeypointBorderClipper;
        const imagePortalSource = this._pipeline.node('imagePortalSource') as SpeedyPipelineNodeImagePortalSource;
        const referenceKeypointPortalSource = this._pipeline.node('referenceKeypointPortalSource') as SpeedyPipelineNodeKeypointPortalSource;

        // get the snapshot from the scanning state
        imagePortalSource.source = this._snapshot!;

        // get the reference keypoints from Pre-Tracking A
        referenceKeypointPortalSource.source = this._referenceKeypointPortalSink!;

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
        const undistort = this._homography.inverse();
        const toScreen = ImageTrackerUtils.NDCToRaster(screenSize);
        const toNDC = ImageTrackerUtils.rasterToNDC(screenSize);

        return imageRectifier.transform.setTo(
            toScreen.times(shrink.times(undistort)).times(toNDC)
        ).then(() => void 0);
    }

    /**
     * Post processing that takes place just after the GPU processing
     * @param result pipeline results
     * @returns state output
     */
    protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>
    {
        const referenceImage = this._referenceImage!;
        const referenceKeypoints = result.referenceKeypoints as SpeedyKeypoint[]; // from Pre-Tracking A
        const keypoints = result.keypoints as SpeedyMatchedKeypoint[]; // from Pre-Tracking B
        const image = result.image as SpeedyMedia | undefined;
        const keypointPortalSink = this._pipeline.node('keypointPortalSink') as SpeedyPipelineNodeKeypointPortalSink;
        const sourceMux = this._pipeline.node('sourceMux') as SpeedyPipelineNodeImageMultiplexer;
        const sourceBuffer = this._pipeline.node('sourceBuffer') as SpeedyPipelineNodeImageBuffer;

        // tracker output
        const trackerOutput: ImageTrackerOutput = {
            keypointsNIS: image !== undefined ? keypoints : undefined, // debug only
            image: image,
        };

        return Speedy.Promise.resolve()
        .then(() => {

            // find matching pairs of keypoints
            const pairs = this._findMatchingPairs(referenceKeypoints, keypoints);
            //const pairs = ImageTrackerUtils.refineMatchingPairs(allPairs);
            if(pairs.length < PRE_TRACK_MIN_MATCHES)
                throw new TrackingError('Not enough data points');

            // find a warp
            const points = ImageTrackerUtils.compilePairsOfKeypointsNDC(pairs);
            return this._findMotionNDC(points);

        })
        .then(warp => {

            // get the camera image in the next iteration
            // the warped snapshot from the scanning state is occasionally very blurry
            sourceMux.port = PORT_CAMERA;
            sourceBuffer.frozen = true;

            // refine the homography
            //return this._homography.setTo(warp.times(this._homography));

            // apply filter
            return ImageTrackerUtils.interpolateHomographies(
                this._homography,
                Speedy.Matrix(warp.times(this._homography)),
                PRE_TRACK_FILTER_ALPHA,
                PRE_TRACK_FILTER_BETA
            );

        })
        .then(filteredHomography => {

            // test: count the number of iterations needed
            // for stabilization with this setup of the filter
            //console.log(this._iterations);

            // refine the homography
            return this._homography.setTo(filteredHomography);

        })
        .then(_ => ({
            nextState: (++this._iterations < PRE_TRACK_MAX_ITERATIONS) ? 'pre-tracking-b' : 'tracking',
            trackerOutput: trackerOutput,
            nextStateSettings: {
                // we export keypoints obtained in Pre-Tracking B, not in A.
                templateKeypoints: keypoints,
                templateKeypointPortalSink: keypointPortalSink,
                referenceImage: this._referenceImage,
                homography: this._homography,
                initialScreenSize: this.screenSize,
            }
        }))
        .catch(err => {
            Utils.warning(`Can't pre-track "${referenceImage.name}" in ${this.name}! ${err.toString()}`);
            return {
                nextState: 'scanning',
                trackerOutput: trackerOutput,
            };
        });
    }

    /**
     * Find a motion model in NDC between pairs of keypoints in NDC
     * given as a 2 x 2n [ src | dest ] matrix
     * @param points compiled pairs of keypoints in NDC
     * @returns a promise that resolves to a 3x3 warp in NDC that maps source to destination
     */
    private _findMotionNDC(points: SpeedyMatrix): SpeedyPromise<SpeedyMatrixExpr>
    {
        //return ImageTrackerUtils.findAffineWarpNDC(points, {
        return ImageTrackerUtils.findPerspectiveWarpNDC(points, {
            method: 'pransac',
            reprojectionError: PRE_TRACK_RANSAC_REPROJECTIONERROR_NDC,
            numberOfHypotheses: 512,
            bundleSize: 128,
            mask: undefined // score is not needed
        }).then(([ warp, score ]) => {

            const scale = TRACK_RECTIFIED_SCALE;
            const aspectRatio = ImageTrackerUtils.bestFitAspectRatioNDC(this.screenSize, this._referenceImage!);
            const shrink = ImageTrackerUtils.bestFitScaleNDC(aspectRatio, scale);
            const grow = ImageTrackerUtils.inverseBestFitScaleNDC(aspectRatio, scale);
            const scaledWarp = grow.times(warp).times(shrink);

            const distort = this._homography;
            const undistort = distort.inverse();
            const correctedWarp = distort.times(scaledWarp).times(undistort);

            //console.log(Speedy.Matrix(warp).toString());
            //console.log(Speedy.Matrix(scaledWarp).toString());
            //console.log(Speedy.Matrix(correctedWarp).toString());

            return correctedWarp;

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
                if(d1 <= PRE_TRACK_MATCH_RATIO * d2) {
                    const srcKeypoint = srcKeypoints[destKeypoint.matches[0].index];
                    pairs.push([srcKeypoint, destKeypoint]);
                }
            }
        }

        return pairs;
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
        const sourceBuffer = Speedy.Image.Buffer('sourceBuffer');
        const referenceKeypointPortalSource = Speedy.Keypoint.Portal.Source('referenceKeypointPortalSource');
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
        const keypointScaler = Speedy.Keypoint.Transformer('keypointScaler');
        const keypointSink = Speedy.Keypoint.SinkOfMatchedKeypoints('keypoints');
        const keypointPortalSink = Speedy.Keypoint.Portal.Sink('keypointPortalSink');
        const referenceKeypointSink = Speedy.Keypoint.Sink('referenceKeypoints');
        //const imageSink = Speedy.Image.Sink('image');

        source.media = null;
        imagePortalSource.source = null;
        sourceMux.port = PORT_PORTAL;
        sourceBuffer.frozen = false;
        referenceKeypointPortalSource.source = null;
        imageRectifier.transform = Speedy.Matrix.Eye(3);
        screen.size = Speedy.Size(0,0);
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
        keypointScaler.transform = Speedy.Matrix.Eye(3);
        keypointSink.turbo = false;

        // prepare input
        imagePortalSource.output().connectTo(sourceMux.input('in0'));
        source.output().connectTo(sourceBuffer.input());
        sourceBuffer.output().connectTo(sourceMux.input('in1'));
        sourceMux.output().connectTo(screen.input());
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
        nightvisionMux.output().connectTo(blur.input());
        blur.output().connectTo(descriptor.input('image'));
        subpixel.output().connectTo(descriptor.input('keypoints'));

        // keypoint matching
        descriptor.output().connectTo(matcher.input('keypoints'));
        referenceKeypointPortalSource.output().connectTo(matcher.input('database'));

        // prepare output
        descriptor.output().connectTo(keypointScaler.input());
        keypointScaler.output().connectTo(keypointPortalSink.input());
        keypointScaler.output().connectTo(keypointSink.input());
        matcher.output().connectTo(keypointSink.input('matches'));
        referenceKeypointPortalSource.output().connectTo(referenceKeypointSink.input());
        //imageRectifier.output().connectTo(imageSink.input());

        // done!
        pipeline.init(
            source, imagePortalSource, sourceBuffer, sourceMux, screen,
            referenceKeypointPortalSource,
            greyscale, imageRectifier,
            nightvision, nightvisionMux,
            detector, borderClipper, clipper,
            denoiser, subpixel,
            blur, descriptor,
            matcher,
            keypointScaler, keypointSink, keypointPortalSink, referenceKeypointSink,
            //imageSink
        );

        return pipeline;
    }
}