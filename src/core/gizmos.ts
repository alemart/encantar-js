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
 * gizmos.ts
 * Visual cues for testing & debugging
 */

import Speedy from 'speedy-vision';
import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
import { SpeedyPoint2 } from 'speedy-vision/types/core/speedy-point';
import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
import { SpeedyKeypoint, SpeedyMatchedKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
import { Resolution } from '../utils/resolution';
import { Nullable, Utils } from '../utils/utils';
import { IllegalArgumentError, IllegalOperationError, TrackingError } from '../utils/errors';
import { Viewport } from './viewport';
import { Tracker } from '../trackers/tracker';
import { ImageTrackerOutput } from '../trackers/image-tracker/image-tracker';

/** The maximum match distance ratio we'll consider to be "good" */
const GOOD_MATCH_THRESHOLD = 0.7;



/**
 * Visual cues for testing & debugging
 */
export class Gizmos
{
    /** Should we render the gizmos? */
    private _visible: boolean;

    /**
     * Constructor
     */
    constructor()
    {
        this._visible = false;
    }

    /**
     * Whether or not the gizmos will be rendered
     */
    get visible(): boolean
    {
        return this._visible;
    }

    /**
     * Whether or not the gizmos will be rendered
     */
    set visible(visible: boolean)
    {
        this._visible = visible;
    }

    /**
     * Render gizmos
     * @param viewport
     * @param trackers
     * @internal
     */
    _render(viewport: Viewport, trackers: Tracker[]): void
    {
        // no need to render?
        if(!this._visible)
            return;

        // viewport
        const viewportSize = viewport._realSize;
        const canvas = viewport._backgroundCanvas;
        const ctx = canvas.getContext('2d', { alpha: false });
        if(!ctx)
            throw new IllegalOperationError();

        // debug
        //ctx.fillStyle = '#000';
        //ctx.fillRect(0, 0, canvas.width, canvas.height);
        //ctx.clearRect(0, 0, canvas.width, canvas.height);

        // render keypoints
        for(let i = 0; i < trackers.length; i++) {
            if(trackers[i].type != 'image-tracker')
                continue;

            const output = trackers[i]._output as ImageTrackerOutput;
            const keypoints = output.keypoints;
            const screenSize = output.screenSize;

            if(keypoints !== undefined && screenSize !== undefined)
                this._splitAndRenderKeypoints(ctx, keypoints, screenSize, viewportSize);
        }

        // render polylines
        for(let i = 0; i < trackers.length; i++) {
            if(trackers[i].type != 'image-tracker')
                continue;

            const output = trackers[i]._output as ImageTrackerOutput;
            const polyline = output.polyline;
            const screenSize = output.screenSize;

            if(polyline !== undefined && screenSize !== undefined)
                this._renderPolyline(ctx, polyline, screenSize, viewportSize);
        }

        // render the axes of the 3D coordinate system
        for(let i = 0; i < trackers.length; i++) {
            if(trackers[i].type != 'image-tracker')
                continue;

            const output = trackers[i]._output as ImageTrackerOutput;
            const cameraMatrix = output.cameraMatrix;
            const screenSize = output.screenSize;

            if(cameraMatrix !== undefined && screenSize !== undefined)
                this._renderAxes(ctx, cameraMatrix, screenSize, viewportSize);
        }
    }

    /**
     * Split keypoints in matched/unmatched categories and
     * render them for testing & development purposes
     * @param ctx canvas 2D context
     * @param keypoints keypoints to render
     * @param screenSize AR screen size
     * @param viewportSize viewport size
     * @param size base keypoint rendering size
     */
    private _splitAndRenderKeypoints(ctx: CanvasRenderingContext2D, keypoints: SpeedyKeypoint[], screenSize: SpeedySize, viewportSize: SpeedySize, size = 1): void
    {
        if(keypoints.length == 0)
            return;

        if(!Object.prototype.hasOwnProperty.call(keypoints[0], '_matches')) { // hack...
            this._renderKeypoints(ctx, keypoints, screenSize, viewportSize, '#f00', size);
            return;
        }

        const isGoodMatch = (keypoint: SpeedyMatchedKeypoint) =>
            (keypoint.matches.length == 1 && keypoint.matches[0].index >= 0) ||
            (keypoint.matches.length > 1 &&
                keypoint.matches[0].index >= 0 && keypoint.matches[1].index >= 0 &&
                keypoint.matches[0].distance <= GOOD_MATCH_THRESHOLD * keypoint.matches[1].distance
            );

        const matchedKeypoints = keypoints as SpeedyMatchedKeypoint[];
        const goodMatches = matchedKeypoints.filter(keypoint => isGoodMatch(keypoint));
        const badMatches = matchedKeypoints.filter(keypoint => !isGoodMatch(keypoint));

        this._renderKeypoints(ctx, badMatches, screenSize, viewportSize, '#f00', size);
        this._renderKeypoints(ctx, goodMatches, screenSize, viewportSize, '#0f0', size);
    }

    /**
     * Render keypoints for testing & development purposes
     * @param ctx canvas 2D context
     * @param keypoints keypoints to render
     * @param screenSize AR screen size
     * @param viewportSize viewport size
     * @param color color of the rendered keypoints
     * @param size base keypoint rendering size
     */
    private _renderKeypoints(ctx: CanvasRenderingContext2D, keypoints: SpeedyKeypoint[], screenSize: SpeedySize, viewportSize: SpeedySize, color = 'red', size = 1): void
    {
        const sx = viewportSize.width / screenSize.width;
        const sy = viewportSize.height / screenSize.height;

        ctx.beginPath();

        for(let i = keypoints.length - 1; i >= 0; i--) {
            const keypoint = keypoints[i];
            const x = (keypoint.x * sx + 0.5) | 0;
            const y = (keypoint.y * sy + 0.5) | 0;
            const r = (size * keypoint.scale + 0.5) | 0;

            ctx.rect(x-r, y-r, 2*r, 2*r);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /**
     * Render polyline for testing & development purposes
     * @param ctx canvas 2D context
     * @param polyline vertices
     * @param screenSize AR screen size
     * @param viewportSize viewport size
     * @param color color of the rendered polyline
     * @param lineWidth
     */
    private _renderPolyline(ctx: CanvasRenderingContext2D, polyline: SpeedyPoint2[], screenSize: SpeedySize, viewportSize: SpeedySize, color = '#0f0', lineWidth = 2): void
    {
        if(polyline.length == 0)
            return;

        const n = polyline.length;
        const sx = viewportSize.width / screenSize.width;
        const sy = viewportSize.height / screenSize.height;

        // render polyline
        ctx.beginPath();

        ctx.moveTo(polyline[n - 1].x * sx, polyline[n - 1].y * sy);
        for(let j = 0; j < n; j++)
            ctx.lineTo(polyline[j].x * sx, polyline[j].y * sy);

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    /**
     * Render the axes of a 3D coordinate system
     * @param ctx canvas 2D context
     * @param cameraMatrix 3x4 camera matrix that maps normalized coordinates [-1,1]^3 to AR screen space
     * @param screenSize AR screen size
     * @param viewportSize viewport size
     * @param lineWidth
     */
    private _renderAxes(ctx: CanvasRenderingContext2D, cameraMatrix: SpeedyMatrix, screenSize: SpeedySize, viewportSize: SpeedySize, lineWidth = 4): void
    {
        const RED = '#f00', GREEN = '#0f0', BLUE = '#00f';
        const color = [ RED, GREEN, BLUE ]; // color of each axis: (X,Y,Z)
        const length = 1; // length of each axis-corresponding line, given in normalized space units
        const sx = viewportSize.width / screenSize.width;
        const sy = viewportSize.height / screenSize.height;

        /*

        Multiply the 3x4 camera matrix P by:

        [ 0  L  0  0 ]
        [ 0  0  L  0 ] , where L = length in normalized space of the lines
        [ 0  0  0  L ]             corresponding to the 3 axes (typically 1)
        [ 1  1  1  1 ]

        Each column of the resulting matrix will give us the pixel coordinates
        we're looking for: origin and the axes.

        Note: we're working with homogeneous coordinates

        */

        const p = cameraMatrix.read();
        const l = length;
        const o = [ p[9], p[10], p[11] ]; // origin of the coordinate system
        const x = [ l*p[0]+p[9], l*p[1]+p[10], l*p[2]+p[11] ]; // x-axis
        const y = [ l*p[3]+p[9], l*p[4]+p[10], l*p[5]+p[11] ]; // y-axis
        const z = [ l*p[6]+p[9], l*p[7]+p[10], l*p[8]+p[11] ]; // z-axis
        const axis = [ x, y, z ];

        // draw each axis
        const ox = o[0] / o[2], oy = o[1] / o[2];
        for(let i = 0; i < 3; i++) {
            const q = axis[i];
            const x = q[0] / q[2], y = q[1] / q[2];

            ctx.beginPath();
            ctx.moveTo(ox * sx, oy * sy);
            ctx.lineTo(x * sx, y * sy);
            ctx.strokeStyle = color[i];
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }

        //console.log("Origin",ox,oy);
    }
}