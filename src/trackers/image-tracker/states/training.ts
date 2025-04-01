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
 * training.ts
 * Training state of the Image Tracker
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
import { SpeedyPipelineNodeImageSource } from 'speedy-vision/types/core/pipeline/nodes/images/source';
import { SpeedyPipelineNodeResize } from 'speedy-vision/types/core/pipeline/nodes/transforms/resize';
import { SpeedyPipelineNodeKeypointTransformer } from 'speedy-vision/types/core/pipeline/nodes/keypoints/transformer';
import { SpeedyKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
import { Resolution } from '../../../utils/resolution';
import { ImageTracker, ImageTrackerOutput, ImageTrackerStateName } from '../image-tracker';
import { ImageTrackerUtils, ImageTrackerKeypointPair } from '../image-tracker-utils';
import { ImageTrackerState, ImageTrackerStateOutput } from './state';
import { ReferenceImage, ReferenceImageWithMedia } from '../reference-image';
import { Nullable, Utils } from '../../../utils/utils';
import { IllegalOperationError, TrainingError } from '../../../utils/errors';
import {
    TRAIN_MAX_KEYPOINTS, SCAN_FAST_THRESHOLD,
    ORB_GAUSSIAN_KSIZE, ORB_GAUSSIAN_SIGMA,
    SCAN_PYRAMID_LEVELS, SCAN_PYRAMID_SCALEFACTOR,
    SCAN_WITH_NIGHTVISION, NIGHTVISION_GAIN, NIGHTVISION_OFFSET, NIGHTVISION_DECAY,
    SUBPIXEL_GAUSSIAN_KSIZE, SUBPIXEL_GAUSSIAN_SIGMA,
    TRAIN_IMAGE_SCALE,
    NIGHTVISION_QUALITY,
    SUBPIXEL_METHOD,
} from '../settings';



/** The training map maps keypoints to reference images */
interface TrainingMap
{
    /** the collection of all keypoints (of all images) */
    readonly keypoints: SpeedyKeypoint[];

    /** maps a keypoint index to an image index */
    readonly referenceImageIndex: number[];

    /** reference images */
    readonly referenceImages: ReferenceImageWithMedia[];
}



/**
 * Training state of the Image Tracker
 */
export class ImageTrackerTrainingState extends ImageTrackerState
{
    /** index of the image being used to train the tracker */
    private _currentImageIndex = 0;

    /** training map */
    private _trainingMap: TrainingMap;



    /**
     * Constructor
     * @param imageTracker
     */
    constructor(imageTracker: ImageTracker)
    {
        super('training', imageTracker);

        // initialize the training map
        this._trainingMap = {
            keypoints: [],
            referenceImageIndex: [],
            referenceImages: [],
        };
    }

    /**
     * Called as soon as this becomes the active state, just before update() runs for the first time
     * @param settings
     */
    onEnterState(settings: Record<string,any>)
    {
        const database = this._imageTracker.database;

        // validate
        if(database.count == 0)
            throw new TrainingError(`Can't train the Image Tracker: the Reference Image Database is empty`);

        // prepare to train...
        this._currentImageIndex = 0;
        this._trainingMap.keypoints.length = 0;
        this._trainingMap.referenceImageIndex.length = 0;
        this._trainingMap.referenceImages.length = 0;

        // lock the database
        Utils.log(`Image Tracker: training using ${database.count} reference image${database.count != 1 ? 's' : ''}`);
        database._lock();

        // collect all images
        for(const referenceImage of database)
            this._trainingMap.referenceImages.push(referenceImage);
    }

    /**
     * Called when leaving the state, after update()
     */
    onLeaveState(): void
    {
        // we don't return to this state, so we can release the pipeline early
        this._pipeline.release();
        this._pipelineReleased = true;
    }

    /**
     * Called just before the GPU processing
     * @returns promise
     */
    protected _beforeUpdate(): SpeedyPromise<void>
    {
        const source = this._pipeline.node('source') as SpeedyPipelineNodeImageSource;
        const screen = this._pipeline.node('screen') as SpeedyPipelineNodeResize;
        const keypointScaler = this._pipeline.node('keypointScaler') as SpeedyPipelineNodeKeypointTransformer;

        // set the appropriate training media
        const referenceImage = this._trainingMap.referenceImages[this._currentImageIndex];
        source.media = referenceImage.media;

        // compute the appropriate size of the training image space
        const resolution = this._imageTracker.resolution;
        const scale = TRAIN_IMAGE_SCALE; // ORB is not scale-invariant
        const aspectRatioOfTrainingImage = referenceImage.aspectRatio;

        screen.size = Utils.resolution(resolution, aspectRatioOfTrainingImage);
        screen.size.width = Math.round(screen.size.width * scale);
        screen.size.height = Math.round(screen.size.height * scale);

        // convert keypoints to NIS
        keypointScaler.transform = ImageTrackerUtils.rasterToNIS(screen.size);

        // log
        Utils.log(`Image Tracker: training using reference image "${referenceImage.name}" at ${screen.size.width}x${screen.size.height}...`);

        // done!
        return Speedy.Promise.resolve();
    }

    /**
     * Post processing that takes place just after the GPU processing
     * @param result pipeline results
     * @returns state output
     */
    protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>
    {
        const referenceImage = this._trainingMap.referenceImages[this._currentImageIndex];
        const keypoints = result.keypoints as SpeedyKeypoint[];
        const image = result.image as SpeedyMedia | undefined;

        // log
        Utils.log(`Image Tracker: found ${keypoints.length} keypoints in reference image "${referenceImage.name}"`);

        // tracker output
        const trackerOutput: ImageTrackerOutput = {
            keypointsNIS: image !== undefined ? keypoints : undefined, // debug only
            image: image,
        };

        // set the training map, so that we can map all keypoints of the current image to the current image
        for(let i = 0; i < keypoints.length; i++) {
            this._trainingMap.keypoints.push(keypoints[i]);
            this._trainingMap.referenceImageIndex.push(this._currentImageIndex);
        }

        // the current image has been processed!
        ++this._currentImageIndex;

        // we're not done yet
        if(this._currentImageIndex < this._trainingMap.referenceImages.length) {
            return Speedy.Promise.resolve({
                nextState: 'training',
                trackerOutput: trackerOutput
            });
        }

        // finished training!
        return Speedy.Promise.resolve({
            nextState: 'scanning',
            trackerOutput: trackerOutput,
            nextStateSettings: {
                database: this._trainingMap.keypoints,
            }
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
        const detector = Speedy.Keypoint.Detector.FAST('fast');
        const descriptor = Speedy.Keypoint.Descriptor.ORB();
        const subpixel = Speedy.Keypoint.SubpixelRefiner();
        const blurredPyramid = Speedy.Image.Pyramid();
        const denoiser = Speedy.Filter.GaussianBlur();
        const clipper = Speedy.Keypoint.Clipper();
        const keypointScaler = Speedy.Keypoint.Transformer('keypointScaler');
        const keypointSink = Speedy.Keypoint.Sink('keypoints');
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
        detector.capacity = 8192;
        subpixel.method = SUBPIXEL_METHOD;
        denoiser.kernelSize = Speedy.Size(SUBPIXEL_GAUSSIAN_KSIZE, SUBPIXEL_GAUSSIAN_KSIZE);
        denoiser.sigma = Speedy.Vector2(SUBPIXEL_GAUSSIAN_SIGMA, SUBPIXEL_GAUSSIAN_SIGMA);
        clipper.size = TRAIN_MAX_KEYPOINTS;
        keypointScaler.transform = Speedy.Matrix.Eye(3);
        keypointSink.turbo = false;

        // prepare input
        source.output().connectTo(screen.input());
        screen.output().connectTo(greyscale.input());

        // preprocess image
        greyscale.output().connectTo(nightvisionMux.input('in0'));
        greyscale.output().connectTo(nightvision.input());
        nightvision.output().connectTo(nightvisionMux.input('in1'));
        nightvisionMux.output().connectTo(pyramid.input());

        // keypoint detection
        pyramid.output().connectTo(detector.input());
        detector.output().connectTo(clipper.input());

        // keypoint refinement
        greyscale.output().connectTo(denoiser.input()); // reduce noise
        denoiser.output().connectTo(blurredPyramid.input());
        clipper.output().connectTo(subpixel.input('keypoints'));
        blurredPyramid.output().connectTo(subpixel.input('image'));

        // keypoint description
        greyscale.output().connectTo(blur.input());
        blur.output().connectTo(descriptor.input('image'));
        subpixel.output().connectTo(descriptor.input('keypoints'));

        // prepare output
        descriptor.output().connectTo(keypointScaler.input());
        keypointScaler.output().connectTo(keypointSink.input());
        //nightvisionMux.output().connectTo(imageSink.input());

        // done!
        pipeline.init(
            source, screen,
            greyscale, nightvision, nightvisionMux,
            pyramid, detector, blur, descriptor, clipper,
            denoiser, blurredPyramid, subpixel,
            keypointScaler, keypointSink,
            //imageSink
        );
        return pipeline;
    }

    /**
     * Get the reference image associated with a keypoint index in the training map
     * @param keypointIndex -1 if not found
     * @returns reference image
     */
    referenceImageOfKeypoint(keypointIndex: number): Nullable<ReferenceImageWithMedia>
    {
        const imageIndex = this.referenceImageIndexOfKeypoint(keypointIndex);
        if(imageIndex < 0)
            return null;

        return this._trainingMap.referenceImages[imageIndex];
    }

    /**
     * Get the reference image index associated with a keypoint index in the training map
     * @param keypointIndex -1 if not found
     * @returns reference image index, or -1 if not found
     */
    referenceImageIndexOfKeypoint(keypointIndex: number): number
    {
        const n = this._trainingMap.referenceImageIndex.length;
        if(keypointIndex < 0 || keypointIndex >= n)
            return -1;

        const imageIndex = this._trainingMap.referenceImageIndex[keypointIndex];
        if(imageIndex < 0 || imageIndex >= this._trainingMap.referenceImages.length)
            return -1;

        return imageIndex;
    }

    /**
     * Get a keypoint of the trained set
     * @param keypointIndex -1 if not found
     * @returns a keypoint
     */
    referenceKeypoint(keypointIndex: number): Nullable<SpeedyKeypoint>
    {
        if(keypointIndex < 0 || keypointIndex >= this._trainingMap.keypoints.length)
            return null;

        return this._trainingMap.keypoints[keypointIndex];
    }
}