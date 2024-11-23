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
 * initial.ts
 * Initial state of the Image Tracker
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
import { ImageTracker, ImageTrackerOutput, ImageTrackerStateName } from '../image-tracker';
import { ImageTrackerState, ImageTrackerStateOutput } from './state';
import { NIGHTVISION_QUALITY, SUBPIXEL_METHOD } from '../settings';
import { SpeedyPipelineNodeImageSource } from 'speedy-vision/types/core/pipeline/nodes/images/source';
import { Utils } from '../../../utils/utils';



/**
 * The purpose of the initial state of the Image Tracker
 * is to initialize the training state using the state machine
 */
export class ImageTrackerInitialState extends ImageTrackerState
{
    /**
     * Constructor
     * @param imageTracker
     */
    constructor(imageTracker: ImageTracker)
    {
        super('initial', imageTracker);
    }

    /**
     * Called just before the GPU processing
     * @returns promise
     */
    protected _beforeUpdate(): SpeedyPromise<void>
    {
        const source = this._pipeline.node('source') as SpeedyPipelineNodeImageSource;
        const media = source.media as SpeedyMedia;
        const mediaSize = media.size;

        if(mediaSize.area() < this.screenSize.area())
            Utils.warning('The resolution of the tracker is larger than the resolution of the video. This is inefficient.');

        return Speedy.Promise.resolve();
    }

    /**
     * Post processing that takes place just after the GPU processing
     * @param result pipeline results
     * @returns state output
     */
    protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>
    {
        return Speedy.Promise.resolve({
            nextState: 'training',
            trackerOutput: { },
        });
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
     * Create & setup the pipeline
     * @returns pipeline
     */
    protected _createPipeline(): SpeedyPipeline
    {
        // this pipeline does nothing useful,
        // but it does preload some shaders...
        const pipeline = Speedy.Pipeline();

        const source = Speedy.Image.Source('source');
        const screen = Speedy.Transform.Resize('screen');
        const greyscale = Speedy.Filter.Greyscale();
        const imageRectifier = Speedy.Transform.PerspectiveWarp();
        const nightvision = Speedy.Filter.Nightvision();
        const nightvisionMux = Speedy.Image.Multiplexer();
        const detector = Speedy.Keypoint.Detector.Harris();
        const descriptor = Speedy.Keypoint.Descriptor.ORB();
        const blur = Speedy.Filter.GaussianBlur();
        const clipper = Speedy.Keypoint.Clipper();
        const borderClipper = Speedy.Keypoint.BorderClipper();
        const denoiser = Speedy.Filter.GaussianBlur();
        const subpixel = Speedy.Keypoint.SubpixelRefiner();
        const matcher = Speedy.Keypoint.Matcher.BFKNN();
        const keypointRectifier = Speedy.Keypoint.Transformer();
        const keypointPortalSink = Speedy.Keypoint.Portal.Sink();
        const keypointPortalSource = Speedy.Keypoint.Portal.Source();
        const muxOfReferenceKeypoints = Speedy.Keypoint.Multiplexer();
        const bufferOfReferenceKeypoints = Speedy.Keypoint.Buffer();
        const muxOfBufferOfReferenceKeypoints = Speedy.Keypoint.Multiplexer();
        const keypointSink = Speedy.Keypoint.SinkOfMatchedKeypoints();

        source.media = null;
        screen.size = Speedy.Size(0,0);
        imageRectifier.transform = Speedy.Matrix.Eye(3);
        nightvision.quality = NIGHTVISION_QUALITY;
        subpixel.method = SUBPIXEL_METHOD;
        //borderClipper.imageSize = screen.size;
        borderClipper.imageSize = Speedy.Size(100,100);
        borderClipper.borderSize = Speedy.Vector2(0,0);
        matcher.k = 1; //2;
        keypointRectifier.transform = Speedy.Matrix.Eye(3);
        keypointPortalSource.source = keypointPortalSink;
        muxOfReferenceKeypoints.port = 0;
        muxOfBufferOfReferenceKeypoints.port = 0;
        bufferOfReferenceKeypoints.frozen = false;
        keypointSink.turbo = false;

        // prepare input
        source.output().connectTo(screen.input());
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

        // done!
        pipeline.init(
            source, screen,
            greyscale, imageRectifier, nightvision, nightvisionMux, blur,
            detector, subpixel, clipper, borderClipper, denoiser, descriptor,
            keypointPortalSource, muxOfReferenceKeypoints, matcher,
            bufferOfReferenceKeypoints, muxOfBufferOfReferenceKeypoints,
            keypointRectifier, keypointSink,
            keypointPortalSink,
        );

        /*
        const run = pipeline.run.bind(pipeline);
        pipeline.run = function() {
            console.time("TIME");
            return run().then(x => {
                console.timeEnd("TIME");
                return x;
            });
        };
        */

        return pipeline;
    }
}