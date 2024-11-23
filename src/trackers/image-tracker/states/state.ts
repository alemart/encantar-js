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
 * state.ts
 * Abstract state of the Image Tracker
 */

import Speedy from 'speedy-vision';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { SpeedyPoint2 } from 'speedy-vision/types/core/speedy-point';
import { SpeedyVector2 } from 'speedy-vision/types/core/speedy-vector';
import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
import { SpeedyPipelineNodeImageSource } from 'speedy-vision/types/core/pipeline/nodes/images/source';
import { SpeedyPipelineNodeResize } from 'speedy-vision/types/core/pipeline/nodes/transforms/resize';
import { SpeedyPipelineNodeKeypointTransformer } from 'speedy-vision/types/core/pipeline/nodes/keypoints/transformer';
import { SpeedyKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
import { ImageTracker, ImageTrackerOutput, ImageTrackerStateName } from '../image-tracker';
import { ReferenceImage } from '../reference-image';
import { TrackerOutput } from '../../tracker';
import { Nullable } from '../../../utils/utils';
import { IllegalOperationError, IllegalArgumentError } from '../../../utils/errors';

/** State output */
export interface ImageTrackerStateOutput
{
    readonly trackerOutput: ImageTrackerOutput;
    readonly nextState: ImageTrackerStateName;
    readonly nextStateSettings?: Record<string,any>;
}

/**
 * Abstract state of the Image Tracker
 */
export abstract class ImageTrackerState
{
    /** image tracker */
    protected readonly _imageTracker: ImageTracker;

    /** state name */
    protected readonly _name: ImageTrackerStateName;

    /** pipeline */
    protected _pipeline: SpeedyPipeline;

    /** a flag telling whether or not the pipeline has been released */
    protected _pipelineReleased: boolean;


    /**
     * Constructor
     * @param name
     * @param imageTracker
     */
    constructor(name: ImageTrackerStateName, imageTracker: ImageTracker)
    {
        this._name = name;
        this._imageTracker = imageTracker;
        this._pipeline = this._createPipeline();
        this._pipelineReleased = false;
    }

    /**
     * State name
     */
    get name(): ImageTrackerStateName
    {
        return this._name;
    }

    /**
     * AR screen size
     * It may change over time, as when flipping a phone
     */
    get screenSize(): SpeedySize
    {
        const screen = this._pipeline.node('screen') as Nullable<SpeedyPipelineNodeResize>;
        if(!screen)
            throw new IllegalOperationError();

        // this is available once this state has run at least once
        return screen.size;
    }

    /**
     * Initialize the state
     */
    init(): void
    {
    }

    /**
     * Release resources
     */
    release(): null
    {
        if(!this._pipelineReleased) {
            this._pipeline.release();
            this._pipelineReleased = true;
        }

        return null;
    }

    /**
     * Update the state
     * @param media user media
     * @param screenSize AR screen size for image processing
     * @param state all states
     * @returns promise
     */
    update(media: SpeedyMedia, screenSize: SpeedySize): SpeedyPromise<ImageTrackerStateOutput>
    {
        const source = this._pipeline.node('source') as Nullable<SpeedyPipelineNodeImageSource>;
        const screen = this._pipeline.node('screen') as Nullable<SpeedyPipelineNodeResize>;

        // validate the pipeline
        if(!source || !screen)
            throw new IllegalOperationError();

        // prepare the pipeline
        source.media = media;
        screen.size = screenSize;

        // run the pipeline
        return this._beforeUpdate().then(() =>
            this._gpuUpdate()
        ).then(result =>
            this._afterUpdate(result)
        );
    }

    /**
     * Called as soon as this becomes the active state, just before update() runs for the first time
     * @param settings
     */
    onEnterState(settings: Record<string,any>): void
    {
    }

    /**
     * Called when leaving the state, after update()
     */
    onLeaveState(): void
    {
    }

    /**
     * Called just before the GPU processing
     * @returns promise
     */
    protected _beforeUpdate(): SpeedyPromise<void>
    {
        return Speedy.Promise.resolve();
    }

    /**
     * GPU processing
     * @returns promise with the pipeline results
     */
    protected _gpuUpdate(): SpeedyPromise<SpeedyPipelineOutput>
    {
        return this._pipeline.run();
    }

    /**
     * Post processing that takes place just after the GPU processing
     * @param result pipeline results
     * @returns state output
     */
    protected abstract _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>;

    /**
     * Create & setup the pipeline
     * @returns pipeline
     */
    protected abstract _createPipeline(): SpeedyPipeline;
}
