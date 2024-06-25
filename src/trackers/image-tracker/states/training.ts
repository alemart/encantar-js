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
import { Resolution } from '../../../core/resolution';
import { ImageTracker, ImageTrackerOutput, ImageTrackerStateName } from '../image-tracker';
import { ImageTrackerState, ImageTrackerStateOutput } from './state';
import { ReferenceImage } from '../reference-image';
import { ReferenceImageDatabase } from '../reference-image-database';
import { Nullable, Utils } from '../../../utils/utils';
import { IllegalOperationError, TrainingError } from '../../../utils/errors';
import {
    TRAIN_MAX_KEYPOINTS, SCAN_FAST_THRESHOLD,
    ORB_GAUSSIAN_KSIZE, ORB_GAUSSIAN_SIGMA,
    SCAN_PYRAMID_LEVELS, SCAN_PYRAMID_SCALEFACTOR,
    SCAN_WITH_NIGHTVISION, NIGHTVISION_GAIN, NIGHTVISION_OFFSET, NIGHTVISION_DECAY,
    SUBPIXEL_GAUSSIAN_KSIZE, SUBPIXEL_GAUSSIAN_SIGMA,
    TRAIN_IMAGE_SCALE,
    TRAIN_TARGET_NORMALIZED_SIZE,
    NIGHTVISION_QUALITY,
    SUBPIXEL_METHOD,
} from '../settings';



/** The training map maps keypoints to reference images */
interface TrainingMap
{
    /** maps a keypoint index to an image index */
    readonly referenceImageIndex: number[];

    /** maps an image index to a reference image */
    readonly referenceImage: ReferenceImage[];

    /** the collection of all keypoints (of all images) */
    readonly keypoints: SpeedyKeypoint[];
}



/**
 * Training state of the Image Tracker
 */
export class ImageTrackerTrainingState extends ImageTrackerState
{
    private _currentImageIndex = 0;
    private _image: ReferenceImage[] = [];
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
            referenceImageIndex: [],
            referenceImage: [],
            keypoints: []
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
        this._image.length = 0;
        this._trainingMap.referenceImageIndex.length = 0;
        this._trainingMap.referenceImage.length = 0;
        this._trainingMap.keypoints.length = 0;

        // lock the database
        Utils.log(`Image Tracker: training using ${database.count} reference image${database.count != 1 ? 's' : ''}`);
        database._lock();

        // collect all images
        for(const referenceImage of database)
            this._image.push(referenceImage);
    }

    /**
     * Called just before the GPU processing
     * @returns promise
     */
    protected _beforeUpdate(): SpeedyPromise<void>
    {
        const arScreenSize = this.screenSize;
        const source = this._pipeline.node('source') as SpeedyPipelineNodeImageSource;
        const screen = this._pipeline.node('screen') as SpeedyPipelineNodeResize;
        const keypointScaler = this._pipeline.node('keypointScaler') as SpeedyPipelineNodeKeypointTransformer;

        // this shouldn't happen
        if(this._currentImageIndex >= this._image.length)
            return Speedy.Promise.reject(new IllegalOperationError());

        // set the appropriate training media
        const database = this._imageTracker.database;
        const referenceImage = this._image[this._currentImageIndex];
        const media = database._findMedia(referenceImage.name);
        source.media = media;

        // compute the appropriate size of the training image space
        const resolution = this._imageTracker.resolution;
        const scale = TRAIN_IMAGE_SCALE; // ORB is not scale-invariant
        const aspectRatioOfTrainingImage = media.width / media.height;

        /*
        let sin = 0, cos = 1;

        if((aspectRatioOfSourceVideo - 1) * (aspectRatioOfTrainingImage - 1) >= 0) {
            // training image and source video: both in landscape mode or both in portrait mode
            screen.size = Utils.resolution(resolution, aspectRatioOfTrainingImage);
            screen.size.width = Math.round(screen.size.width * scale);
            screen.size.height = Math.round(screen.size.height * scale);
        }
        else if(aspectRatioOfTrainingImage > aspectRatioOfSourceVideo) {
            // training image: portrait mode; source video: landscape mode
            screen.size = Utils.resolution(resolution, 1 / aspectRatioOfTrainingImage);
            screen.size.width = Math.round(screen.size.width * scale);
            screen.size.height = Math.round(screen.size.height * scale);
            sin = 1; cos = 0; // rotate 90deg
        }
        else {
            // training image: landscape mode; source video: portrait mode
        }
        */
        screen.size = Utils.resolution(resolution, aspectRatioOfTrainingImage);
        screen.size.width = Math.round(screen.size.width * scale);
        screen.size.height = Math.round(screen.size.height * scale);


        // convert keypoints from the training image space to AR screen space
        // let's pretend that trained keypoints belong to the AR screen space,
        // regardless of the size of the target image. This will make things
        // easier when computing the homography.
        /*
        const sw = arScreenSize.width / screen.size.width;
        const sh = arScreenSize.height / screen.size.height;
        */
        const sw = TRAIN_TARGET_NORMALIZED_SIZE / screen.size.width;
        const sh = TRAIN_TARGET_NORMALIZED_SIZE / screen.size.height;
        keypointScaler.transform = Speedy.Matrix(3, 3, [
            sw, 0,  0,
            0,  sh, 0,
            0,  0,  1,
        ]);

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
        const referenceImage = this._image[this._currentImageIndex];
        const keypoints = result.keypoints as SpeedyKeypoint[];
        const image = result.image as SpeedyMedia | undefined;

        // log
        Utils.log(`Image Tracker: found ${keypoints.length} keypoints in reference image "${referenceImage.name}"`);

        // set the training map, so that we can map all keypoints of the current image to the current image
        this._trainingMap.referenceImage.push(referenceImage);
        for(let i = 0; i < keypoints.length; i++) {
            this._trainingMap.keypoints.push(keypoints[i]);
            this._trainingMap.referenceImageIndex.push(this._currentImageIndex);
        }

        // the current image has been processed!
        ++this._currentImageIndex;

        // set output
        if(this._currentImageIndex >= this._image.length) {

            // finished training!
            return Speedy.Promise.resolve({
                //nextState: 'training',
                nextState: 'scanning',
                nextStateSettings: {
                    keypoints: this._trainingMap.keypoints,
                },
                trackerOutput: { },
                //trackerOutput: { image, keypoints, screenSize: this.screenSize },
            });

        }
        else {

            // we're not done yet
            return Speedy.Promise.resolve({
                nextState: 'training',
                trackerOutput: { },
                //trackerOutput: { image, keypoints, screenSize: this.screenSize },
            });

        }
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
        const imageSink = Speedy.Image.Sink('image');

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
        clipper.output().connectTo(descriptor.input('keypoints'));

        // prepare output
        descriptor.output().connectTo(keypointScaler.input());
        keypointScaler.output().connectTo(keypointSink.input());
        nightvisionMux.output().connectTo(imageSink.input());

        // done!
        pipeline.init(
            source, screen,
            greyscale, nightvision, nightvisionMux,
            pyramid, detector, blur, descriptor, clipper,
            denoiser, blurredPyramid, subpixel,
            keypointScaler, keypointSink,
            imageSink
        );
        return pipeline;
    }

    /**
     * Get reference image
     * @param keypointIndex -1 if not found
     * @returns reference image
     */
    referenceImageOfKeypoint(keypointIndex: number): Nullable<ReferenceImage>
    {
        const imageIndex = this.referenceImageIndexOfKeypoint(keypointIndex);
        if(imageIndex < 0)
            return null;

        return this._trainingMap.referenceImage[imageIndex];
    }

    /**
     * Get reference image index
     * @param keypointIndex -1 if not found
     * @returns reference image index, or -1 if not found
     */
    referenceImageIndexOfKeypoint(keypointIndex: number): number
    {
        const n = this._trainingMap.referenceImageIndex.length;
        if(keypointIndex < 0 || keypointIndex >= n)
            return -1;

        const imageIndex = this._trainingMap.referenceImageIndex[keypointIndex];
        if(imageIndex < 0 || imageIndex >= this._trainingMap.referenceImage.length)
            return -1;

        return imageIndex;
    }

    /**
     * Get keypoint of the trained set
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