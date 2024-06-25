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
import { TrackerOutput } from '../../tracker';
import { Nullable } from '../../../utils/utils';
import { IllegalOperationError } from '../../../utils/errors';
import { TRACK_RECTIFIED_BORDER } from '../settings';

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
        return this._pipeline.release();
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



    //
    // Some utility methods common to various states
    //

    /**
     * Find the coordinates of a polyline surrounding the target image
     * @param homography maps the target image to the AR screen
     * @param targetSize size of the target space
     * @returns promise that resolves to 4 points in AR screen space
     */
    protected _findPolylineCoordinates(homography: SpeedyMatrix, targetSize: SpeedySize): SpeedyPromise<SpeedyMatrix>
    {
        const w = targetSize.width, h = targetSize.height;
        const referenceImageCoordinates = Speedy.Matrix(2, 4, [
            0, 0,
            w, 0,
            w, h,
            0, h,
        ]);

        const polylineCoordinates = Speedy.Matrix.Zeros(2, 4);
        return Speedy.Matrix.applyPerspectiveTransform(
            polylineCoordinates,
            referenceImageCoordinates,
            homography
        );
    }

    /**
     * Find a polyline surrounding the target image
     * @param homography maps the target image to the AR screen
     * @param targetSize size of the target space
     * @returns promise that resolves to 4 points in AR screen space
     */
    protected _findPolyline(homography: SpeedyMatrix, targetSize: SpeedySize): SpeedyPromise<SpeedyPoint2[]>
    {
        return this._findPolylineCoordinates(homography, targetSize).then(polylineCoordinates => {
            const polydata = polylineCoordinates.read();
            const polyline = Array.from({ length: 4 }, (_, i) => Speedy.Point2(polydata[2*i], polydata[2*i+1]));

            return polyline;
        });
    }

    /**
     * Whether or not to rotate the warped image in order to best fit the AR screen
     * @param media media associated with the reference image
     * @param screenSize AR screen
     * @returns boolean
     */
    protected _mustRotateWarpedImage(media: SpeedyMedia, screenSize: SpeedySize): boolean
    {
        const screenAspectRatio = screenSize.width / screenSize.height;
        const mediaAspectRatio = media.width / media.height;
        const eps = 0.1;

        return (mediaAspectRatio >= 1+eps && screenAspectRatio < 1-eps) || (mediaAspectRatio < 1-eps && screenAspectRatio >= 1+eps);
    }

    /**
     * Find a rectification matrix to be applied to an image fitting the entire AR screen
     * @param media media associated with the reference image
     * @param screenSize AR screen
     * @returns promise that resolves to a rectification matrix
     */
    protected _findRectificationMatrixOfFullscreenImage(media: SpeedyMedia, screenSize: SpeedySize): SpeedyPromise<SpeedyMatrix>
    {
        const b = TRACK_RECTIFIED_BORDER;
        const sw = screenSize.width, sh = screenSize.height;
        const mediaAspectRatio = media.width / media.height;
        const mustRotate = this._mustRotateWarpedImage(media, screenSize);

        // compute the vertices of the target in screen space
        // we suppose portrait or landscape mode for both screen & media
        const c = mustRotate ? 1 / mediaAspectRatio : mediaAspectRatio;
        const top = sw >= sh ? b * sh : (sh - sw * (1-2*b) / c) / 2;
        const left = sw >= sh ? (sw - sh * (1-2*b) * c) / 2 : b * sw;
        const right = sw - left;
        const bottom = sh - top;

        const targetVertices = Speedy.Matrix(2, 4, [
            left, top,
            right, top,
            right, bottom,
            left, bottom,
        ]);

        const screenVertices = Speedy.Matrix(2, 4, [
            0, 0,
            sw, 0,
            sw, sh,
            0, sh
        ]);

        const preRectificationMatrix = Speedy.Matrix.Eye(3);
        const alignmentMatrix = Speedy.Matrix.Zeros(3);
        const rectificationMatrix = Speedy.Matrix.Zeros(3);

        return (mustRotate ? Speedy.Matrix.perspective(
            // pre-rectifation: rotate by 90 degrees counterclockwise and scale to screenSize
            preRectificationMatrix,
            screenVertices,
            Speedy.Matrix(2, 4, [ 0,sh , 0,0 , sw,0 , sw,sh ])
        ) : Speedy.Promise.resolve(preRectificationMatrix)).then(_ =>
            // alignment: align the target to the center of the screen
            Speedy.Matrix.perspective(
                alignmentMatrix,
                screenVertices,
                targetVertices
            )
        ).then(_ =>
            // pre-rectify and then align
            rectificationMatrix.setTo(alignmentMatrix.times(preRectificationMatrix))
        );
    }

    /**
     * Find a rectification matrix to be applied to the target image
     * @param homography maps a reference image to the AR screen
     * @param targetSize size of the target space
     * @param media media associated with the reference image
     * @param screenSize AR screen
     * @returns promise that resolves to a rectification matrix
     */
    protected _findRectificationMatrixOfCameraImage(homography: SpeedyMatrix, targetSize: SpeedySize, media: SpeedyMedia, screenSize: SpeedySize): SpeedyPromise<SpeedyMatrix>
    {
        const sw = screenSize.width, sh = screenSize.height;
        const screen = Speedy.Matrix(2, 4, [ 0, 0, sw, 0, sw, sh, 0, sh ]);

        const rectificationMatrix = Speedy.Matrix.Zeros(3);
        return this._findPolylineCoordinates(homography, targetSize).then(polyline =>

            // from target space to (full)screen
            Speedy.Matrix.perspective(rectificationMatrix, polyline, screen)

        ).then(_ =>

            // from (full)screen to rectified coordinates
            this._findRectificationMatrixOfFullscreenImage(media, screenSize)

        ).then(mat =>

            // function composition
            rectificationMatrix.setTo(mat.times(rectificationMatrix))

        );
    }
}