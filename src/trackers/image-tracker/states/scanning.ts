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
 * scanning.ts
 * Scanning state of the Image Tracker
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { SpeedyPoint2 } from 'speedy-vision/types/core/speedy-point';
import { SpeedyVector2 } from 'speedy-vision/types/core/speedy-vector';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
import { SpeedyPipelineNodeImageSource } from 'speedy-vision/types/core/pipeline/nodes/images/source';
import { SpeedyPipelineNodeImageMultiplexer } from 'speedy-vision/types/core/pipeline/nodes/images/multiplexer';
import { SpeedyPipelineNodeResize } from 'speedy-vision/types/core/pipeline/nodes/transforms/resize';
import { SpeedyPipelineNodeKeypointTransformer } from 'speedy-vision/types/core/pipeline/nodes/keypoints/transformer';
import { SpeedyPipelineNodeKeypointBorderClipper } from 'speedy-vision/types/core/pipeline/nodes/keypoints/border-clipper';
import { SpeedyPipelineNodeImagePortalSource, SpeedyPipelineNodeImagePortalSink } from 'speedy-vision/types/core/pipeline/nodes/images/portal';
import { SpeedyPipelineNodeStaticLSHTables } from 'speedy-vision/types/core/pipeline/nodes/keypoints/matchers/lsh-static-tables';
import { SpeedyKeypoint, SpeedyMatchedKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
import { ImageTracker, ImageTrackerOutput, ImageTrackerStateName } from '../image-tracker';
import { ImageTrackerState, ImageTrackerStateOutput } from './state';
import { ImageTrackerPreTrackingState } from './pre-tracking';
import { Nullable, Utils } from '../../../utils/utils';
import { IllegalOperationError, IllegalArgumentError, DetectionError } from '../../../utils/errors';
import { 
    SCAN_MATCH_RATIO, SCAN_MIN_MATCHES, SCAN_CONSECUTIVE_FRAMES,
    ORB_GAUSSIAN_KSIZE, ORB_GAUSSIAN_SIGMA,
    NIGHTVISION_GAIN, NIGHTVISION_OFFSET, NIGHTVISION_DECAY,
    SCAN_WITH_NIGHTVISION, SCAN_PYRAMID_LEVELS, SCAN_PYRAMID_SCALEFACTOR,
    SCAN_FAST_THRESHOLD, SCAN_MAX_KEYPOINTS, SCAN_LSH_TABLES, SCAN_LSH_HASHSIZE,
    SCAN_RANSAC_REPROJECTIONERROR,
    TRAIN_TARGET_NORMALIZED_SIZE,
    NIGHTVISION_QUALITY,
} from '../settings';


/** Default target space size (used when training) */
const DEFAULT_TARGET_SPACE_SIZE = Speedy.Size(TRAIN_TARGET_NORMALIZED_SIZE, TRAIN_TARGET_NORMALIZED_SIZE);

/** Port of the portal multiplexer: get new data from the camera */
const PORT_CAMERA = 0;

/** Port of the portal multiplexer: get previously memorized data */
const PORT_MEMORY = 1;



/**
 * Scanning state of the Image Tracker
 */
export class ImageTrackerScanningState extends ImageTrackerState
{
    /** counts consecutive frames (matching) */
    private _counter: number;

    /** best homography matrix found so far */
    private _bestHomography: SpeedyMatrix;

    /** score related to the number of inliers (for robust homography estimation) */
    private _bestScore: number;



    /**
     * Constructor
     * @param imageTracker
     */
    constructor(imageTracker: ImageTracker)
    {
        super('scanning', imageTracker);

        this._counter = 0;
        this._bestScore = 0;
        this._bestHomography = Speedy.Matrix.Eye(3);
    }

    /**
     * Called as soon as this becomes the active state, just before update() runs for the first time
     * @param settings
     */
    onEnterState(settings: Record<string,any>)
    {
        const imagePortalMux = this._pipeline.node('imagePortalMux') as SpeedyPipelineNodeImageMultiplexer;
        const lshTables = this._pipeline.node('lshTables') as SpeedyPipelineNodeStaticLSHTables;
        const keypoints = settings.keypoints as SpeedyKeypoint[] | undefined;

        // set attributes
        this._counter = 0;
        this._bestScore = 0;

        // reset the image memorization circuit
        imagePortalMux.port = PORT_CAMERA;

        // prepare the keypoint matcher
        if(keypoints !== undefined)
            lshTables.keypoints = keypoints;
    }

    /**
     * Post processing that takes place just after the GPU processing
     * @param result pipeline results
     * @returns state output
     */
    protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>
    {
        const imagePortalMux = this._pipeline.node('imagePortalMux') as SpeedyPipelineNodeImageMultiplexer;
        const keypoints = result.keypoints as SpeedyMatchedKeypoint[];
        const matchedKeypoints = this._goodMatches(keypoints);

        // tracker output
        const trackerOutput: ImageTrackerOutput = {
            keypoints: keypoints,
            screenSize: this.screenSize
        };

        // keep the last memorized image
        imagePortalMux.port = PORT_MEMORY;

        // have we found enough matches...?
        if(matchedKeypoints.length >= SCAN_MIN_MATCHES) {
            return this._findHomography(matchedKeypoints).then(([homography, score]) => {

                // have we found the best homography so far?
                if(score >= this._bestScore) {
                    // store it only if we'll be running the pipeline again
                    if(this._counter < SCAN_CONSECUTIVE_FRAMES - 1) {
                        this._bestScore = score;
                        this._bestHomography = homography;

                        // memorize the last image, corresponding to the best homography(*)
                        imagePortalMux.port = PORT_CAMERA;

                        /*

                        (*) technically speaking, this is not exactly the case. Since we're
                            using turbo to download the keypoints, there's a slight difference
                            between the data used to compute the homography and the last image.
                            Still, assuming continuity of the video stream, this logic is
                            good enough.

                        */
                    }
                }

                // find a polyline surrounding the target
                return this._findPolyline(homography, DEFAULT_TARGET_SPACE_SIZE);

            }).then(polyline => {

                // continue a little longer in the scanning state
                if(++this._counter < SCAN_CONSECUTIVE_FRAMES) {
                    return {
                        nextState: this.name,
                        trackerOutput: {
                            polyline: polyline,
                            ...trackerOutput,
                        },
                    };
                }

                // this image should correspond to the best homography
                const snapshot = this._pipeline.node('imagePortalSink') as SpeedyPipelineNodeImagePortalSink;

                // the reference image that we'll track
                const referenceImage = this._imageTracker._referenceImageOfKeypoint(
                    matchedKeypoints[0].matches[0].index
                );

                // let's track the target!
                return {
                    nextState: 'pre-tracking',
                    nextStateSettings: {
                        homography: this._bestHomography,
                        snapshot: snapshot,
                        referenceImage: referenceImage,
                    },
                    trackerOutput: {
                        polyline: polyline,
                        ...trackerOutput,
                    },
                };

            }).catch(() => {

                // continue in the scanning state
                return {
                    nextState: this.name,
                    trackerOutput: trackerOutput,
                };

            });
        }
        else {

            // not enough matches...!
            this._counter = 0;
            this._bestScore = 0;

        }

        // we'll continue to scan the scene
        return Speedy.Promise.resolve({
            nextState: this.name,
            trackerOutput: trackerOutput,
        });
    }

    /**
     * Find "high quality" matches of a single reference image
     * @param keypoints
     * @returns high quality matches
     */
    private _goodMatches(keypoints: SpeedyMatchedKeypoint[]): SpeedyMatchedKeypoint[]
    {
        const matchedKeypointsPerImageIndex: Record<number,SpeedyMatchedKeypoint[]> = Object.create(null);

        // filter "good matches"
        for(let j = keypoints.length - 1; j >= 0; j--) {
            const keypoint = keypoints[j];
            if(keypoint.matches[0].index >= 0 && keypoint.matches[1].index >= 0) {
                const d1 = keypoint.matches[0].distance, d2 = keypoint.matches[1].distance;

                // the best match should be "much better" than the second best match,
                // which means that they are "distinct enough"
                if(d1 <= SCAN_MATCH_RATIO * d2) {
                    const idx1 = this._imageTracker._referenceImageIndexOfKeypoint(keypoint.matches[0].index);
                    //const idx2 = this._imageTracker._referenceImageIndexOfKeypoint(keypoint.matches[1].index);
                    //if(idx1 == idx2 && idx1 >= 0) {
                    if(idx1 >= 0) {
                        if(!Object.prototype.hasOwnProperty.call(matchedKeypointsPerImageIndex, idx1))
                            matchedKeypointsPerImageIndex[idx1] = [];
                        matchedKeypointsPerImageIndex[idx1].push(keypoint);
                    }
                }

            }
        }

        // find the image with the most matches
        let matchedKeypoints: SpeedyMatchedKeypoint[] = [];
        for(const imageIndex in matchedKeypointsPerImageIndex) {
            if(matchedKeypointsPerImageIndex[imageIndex].length > matchedKeypoints.length)
                matchedKeypoints = matchedKeypointsPerImageIndex[imageIndex];
        }

        // done!
        return matchedKeypoints;
    }

    /**
     * Find a homography matrix using matched keypoints
     * @param matchedKeypoints "good" matches only
     * @returns homography from reference image space to AR screen space & homography "quality" score
     */
    private _findHomography(matchedKeypoints: SpeedyMatchedKeypoint[]): SpeedyPromise<[SpeedyMatrix,number]>
    {
        const srcCoords: number[] = [];
        const dstCoords: number[] = [];

        // find matching coordinates of the keypoints
        for(let i = matchedKeypoints.length - 1; i >= 0; i--) {
            const matchedKeypoint = matchedKeypoints[i];
            const referenceKeypoint = this._imageTracker._referenceKeypoint(matchedKeypoint.matches[0].index);
            if(referenceKeypoint != null) {
                srcCoords.push(referenceKeypoint.x);
                srcCoords.push(referenceKeypoint.y);
                dstCoords.push(matchedKeypoint.x);
                dstCoords.push(matchedKeypoint.y);
            }
            else {
                // this shouldn't happen
                return Speedy.Promise.reject(
                    new DetectionError(`Invalid keypoint match index: ${matchedKeypoint.matches[0].index} from ${matchedKeypoint.toString()}`)
                );
            }
        }

        // too few points?
        const n = srcCoords.length / 2;
        if(n < 4) {
            return Speedy.Promise.reject(
                new DetectionError(`Too few points to compute a homography`)
            );
        }

        // compute a homography
        const src = Speedy.Matrix(2, n, srcCoords);
        const dst = Speedy.Matrix(2, n, dstCoords);
        const mask = Speedy.Matrix.Zeros(1, n);

        const homography = Speedy.Matrix.Zeros(3);
        return Speedy.Matrix.findHomography(homography, src, dst, {
            method: 'pransac',
            reprojectionError: SCAN_RANSAC_REPROJECTIONERROR,
            numberOfHypotheses: 512,
            bundleSize: 128,
            mask: mask,
        }).then(homography => {

            // check if this is a valid homography
            const a00 = homography.at(0,0);
            if(Number.isNaN(a00))
                throw new DetectionError(`Can't compute homography`);

            // count the number of inliers
            const inliers = mask.read();
            let inlierCount = 0;
            for(let i = inliers.length - 1; i >= 0; i--)
                inlierCount += inliers[i];
            const score = inlierCount / inliers.length;

            // done!
            return [ homography, score ];

        });
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
        const blur = Speedy.Filter.GaussianBlur();
        const nightvision = Speedy.Filter.Nightvision();
        const nightvisionMux = Speedy.Image.Multiplexer('nightvisionMux');
        const pyramid = Speedy.Image.Pyramid();
        const detector = Speedy.Keypoint.Detector.FAST();
        const descriptor = Speedy.Keypoint.Descriptor.ORB();
        const clipper = Speedy.Keypoint.Clipper();
        const lshTables = Speedy.Keypoint.Matcher.StaticLSHTables('lshTables');
        const knn = Speedy.Keypoint.Matcher.LSHKNN();
        const keypointSink = Speedy.Keypoint.SinkOfMatchedKeypoints('keypoints');
        const imagePortalSink = Speedy.Image.Portal.Sink('imagePortalSink');
        const imagePortalSource = Speedy.Image.Portal.Source('imagePortalSource');
        const imagePortalMux = Speedy.Image.Multiplexer('imagePortalMux');
        const imagePortalBuffer = Speedy.Image.Buffer();
        const imagePortalCopy = Speedy.Transform.Resize();
        //const imageSink = Speedy.Image.Sink('image');

        source.media = null;
        screen.size = Speedy.Size(0,0);
        blur.kernelSize = Speedy.Size(ORB_GAUSSIAN_KSIZE, ORB_GAUSSIAN_KSIZE);
        blur.sigma = Speedy.Vector2(ORB_GAUSSIAN_SIGMA, ORB_GAUSSIAN_SIGMA);
        nightvision.gain = NIGHTVISION_GAIN;
        nightvision.offset = NIGHTVISION_OFFSET;
        nightvision.decay = NIGHTVISION_DECAY;
        nightvision.quality = NIGHTVISION_QUALITY;
        nightvisionMux.port = SCAN_WITH_NIGHTVISION ? 1 : 0; // 1 = enable nightvision
        detector.levels = SCAN_PYRAMID_LEVELS;
        detector.scaleFactor = SCAN_PYRAMID_SCALEFACTOR;
        detector.threshold = SCAN_FAST_THRESHOLD;
        detector.capacity = 2048;
        clipper.size = SCAN_MAX_KEYPOINTS;
        lshTables.keypoints = [];
        lshTables.numberOfTables = SCAN_LSH_TABLES;
        lshTables.hashSize = SCAN_LSH_HASHSIZE;
        knn.k = 2;
        knn.quality = 'default';
        //knn.quality = 'fastest';
        imagePortalSource.source = imagePortalSink;
        imagePortalMux.port = PORT_CAMERA; // 0 = camera stream; 1 = lock image
        imagePortalCopy.size = Speedy.Size(0,0);
        imagePortalCopy.scale = Speedy.Vector2(1,1);
        keypointSink.turbo = true;

        // prepare input
        source.output().connectTo(screen.input());
        screen.output().connectTo(greyscale.input());

        // preprocess image
        greyscale.output().connectTo(blur.input());
        greyscale.output().connectTo(nightvisionMux.input('in0'));
        greyscale.output().connectTo(nightvision.input());
        nightvision.output().connectTo(nightvisionMux.input('in1'));
        nightvisionMux.output().connectTo(pyramid.input());

        // keypoint detection
        pyramid.output().connectTo(detector.input());
        detector.output().connectTo(clipper.input());

        // keypoint description
        blur.output().connectTo(descriptor.input('image'));
        clipper.output().connectTo(descriptor.input('keypoints'));

        // keypoint matching
        descriptor.output().connectTo(knn.input('keypoints'));
        lshTables.output().connectTo(knn.input('lsh'));

        // prepare output
        clipper.output().connectTo(keypointSink.input());
        knn.output().connectTo(keypointSink.input('matches'));
        //pyramid.output().connectTo(imageSink.input());

        // memorize image
        source.output().connectTo(imagePortalBuffer.input());
        imagePortalBuffer.output().connectTo(imagePortalMux.input('in0'));
        imagePortalSource.output().connectTo(imagePortalCopy.input());
        imagePortalCopy.output().connectTo(imagePortalMux.input('in1'));
        imagePortalMux.output().connectTo(imagePortalSink.input());

        // done!
        pipeline.init(
            source, screen,
            greyscale, blur, nightvision, nightvisionMux, pyramid,
            detector, descriptor, clipper,
            lshTables, knn,
            keypointSink,
            imagePortalSink, imagePortalSource,
            imagePortalMux, imagePortalBuffer, imagePortalCopy,
            //, imageSink
        );
        return pipeline;
    }
}