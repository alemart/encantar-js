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
 * pre-tracking-a.ts
 * Image tracker: Pre-Tracking A state
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
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
import { SpeedyKeypoint, SpeedyMatchedKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
import { ImageTracker, ImageTrackerOutput, ImageTrackerStateName } from '../image-tracker';
import { ImageTrackerUtils, ImageTrackerKeypointPair } from '../image-tracker-utils';
import { ImageTrackerState, ImageTrackerStateOutput } from './state';
import { ReferenceImage, ReferenceImageWithMedia } from '../reference-image';
import { Nullable, Utils } from '../../../utils/utils';
import { TrackingError } from '../../../utils/errors';
import {
    TRACK_RECTIFIED_SCALE, TRACK_CLIPPING_BORDER,
    NIGHTVISION_GAIN, NIGHTVISION_OFFSET, NIGHTVISION_DECAY, TRACK_WITH_NIGHTVISION,
    ORB_GAUSSIAN_KSIZE, ORB_GAUSSIAN_SIGMA,
    TRACK_HARRIS_QUALITY, TRACK_DETECTOR_CAPACITY, TRACK_MAX_KEYPOINTS,
    SUBPIXEL_GAUSSIAN_KSIZE, SUBPIXEL_GAUSSIAN_SIGMA,
    PRE_TRACK_MIN_MATCHES,
    NIGHTVISION_QUALITY,
    SUBPIXEL_METHOD,
} from '../settings';



/**
 * Pre-Tracking A is a new training phase. The reference image that was found
 * in the scanning state is transported to AR screen space, and a new training
 * takes place there, with new keypoints and in a suitable warp.
 */
export class ImageTrackerPreTrackingAState extends ImageTrackerState
{
    /** reference image */
    private _referenceImage: Nullable<ReferenceImageWithMedia>;

    /** a snapshot of the video from the scanning state and corresponding to the initial homography */
    private _snapshot: Nullable<SpeedyPipelineNodeImagePortalSink>;

    /** initial homography, from reference image to scanned image, NDC */
    private _homography: SpeedyMatrix;



    /**
     * Constructor
     * @param imageTracker
     */
    constructor(imageTracker: ImageTracker)
    {
        super('pre-tracking-a', imageTracker);

        this._homography = Speedy.Matrix.Eye(3);
        this._referenceImage = null;
        this._snapshot = null;
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

        // set attributes
        this._homography = homography;
        this._referenceImage = referenceImage;
        this._snapshot = snapshot;
    }

    /**
     * Called just before the GPU processing
     * @returns promise
     */
    protected _beforeUpdate(): SpeedyPromise<void>
    {
        const screenSize = this.screenSize;
        const source = this._pipeline.node('source') as SpeedyPipelineNodeImageSource;
        const imageRectifier = this._pipeline.node('imageRectifier') as SpeedyPipelineNodePerspectiveWarp;
        const keypointScaler = this._pipeline.node('keypointScaler') as SpeedyPipelineNodeKeypointTransformer;
        const borderClipper = this._pipeline.node('borderClipper') as SpeedyPipelineNodeKeypointBorderClipper;

        // set the reference image as the source image
        source.media = this._referenceImage!.media;

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
        const toScreen = ImageTrackerUtils.NDCToRaster(screenSize);
        const toNDC = ImageTrackerUtils.rasterToNDC(screenSize);

        return imageRectifier.transform.setTo(
            toScreen.times(shrink).times(toNDC)
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
        const keypointPortalSink = this._pipeline.node('keypointPortalSink') as SpeedyPipelineNodeKeypointPortalSink;
        const keypoints = result.keypoints as SpeedyKeypoint[];
        const image = result.image as SpeedyMedia | undefined;

        // tracker output
        const trackerOutput: ImageTrackerOutput = {
            keypointsNIS: image !== undefined ? keypoints : undefined, // debug only
            image: image,
        };

        // not enough keypoints? something went wrong!
        if(keypoints.length < PRE_TRACK_MIN_MATCHES) {
            Utils.warning(`Can't pre-track "${referenceImage.name}" in ${this.name}!`);
            return Speedy.Promise.resolve({
                nextState: 'scanning',
                trackerOutput: trackerOutput,
            });
        }

        // done!
        return Speedy.Promise.resolve({
            nextState: 'pre-tracking-b',
            trackerOutput: trackerOutput,
            nextStateSettings: {
                referenceKeypointPortalSink: keypointPortalSink,
                referenceImage: this._referenceImage,
                snapshot: this._snapshot,
                homography: this._homography,
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
        const keypointScaler = Speedy.Keypoint.Transformer('keypointScaler');
        const keypointPortalSink = Speedy.Keypoint.Portal.Sink('keypointPortalSink');
        const keypointSink = Speedy.Keypoint.Sink('keypoints');
        //const imageSink = Speedy.Image.Sink('image');

        source.media = null;
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
        keypointScaler.transform = Speedy.Matrix.Eye(3);
        keypointSink.turbo = false;

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
        nightvisionMux.output().connectTo(blur.input());
        blur.output().connectTo(descriptor.input('image'));
        subpixel.output().connectTo(descriptor.input('keypoints'));

        // prepare output
        descriptor.output().connectTo(keypointScaler.input());
        keypointScaler.output().connectTo(keypointSink.input());
        keypointScaler.output().connectTo(keypointPortalSink.input());
        //imageRectifier.output().connectTo(imageSink.input());

        // done!
        pipeline.init(
            source, screen,
            greyscale, imageRectifier,
            nightvision, nightvisionMux,
            detector, borderClipper, clipper,
            denoiser, subpixel,
            blur, descriptor,
            keypointScaler, keypointSink, keypointPortalSink,
            //imageSink
        );

        return pipeline;
    }
}
