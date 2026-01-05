declare module "utils/errors" {
    /**
     * Base error class
     */
    export abstract class ARError extends Error {
        readonly cause: Error | null;
        /**
         * Constructor
         * @param message error message
         * @param cause cause of the error
         */
        constructor(message?: string, cause?: Error | null);
        /**
         * Error name
         */
        abstract get name(): string;
        /**
         * Convert to string
         */
        toString(): string;
    }
    /**
     * A method has received one or more illegal arguments
     */
    export class IllegalArgumentError extends ARError {
        get name(): string;
    }
    /**
     * The method arguments are valid, but the method can't be called due to the
     * current state of the object
     */
    export class IllegalOperationError extends ARError {
        get name(): string;
    }
    /**
     * The requested operation is not supported
     */
    export class NotSupportedError extends ARError {
        get name(): string;
    }
    /**
     * Access denied
     */
    export class AccessDeniedError extends ARError {
        get name(): string;
    }
    /**
     * Timeout
     */
    export class TimeoutError extends ARError {
        get name(): string;
    }
    /**
     * Assertion error
     */
    export class AssertionError extends ARError {
        get name(): string;
    }
    /**
     * Numerical error
     */
    export class NumericalError extends ARError {
        get name(): string;
    }
    /**
     * Tracking error
     */
    export class TrackingError extends ARError {
        get name(): string;
    }
    /**
     * Detection error
     */
    export class DetectionError extends ARError {
        get name(): string;
    }
    /**
     * Training error
     */
    export class TrainingError extends ARError {
        get name(): string;
    }
}
declare module "utils/resolution" {
    import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
    type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
    type EvenDigit = '0' | '2' | '4' | '6' | '8';
    type PositiveDigit = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
    type OptionalDigit = Digit | '';
    type CustomResolution = `${PositiveDigit}${OptionalDigit}${Digit}${EvenDigit}p`;
    type ResolutionAlias = 'xs' | 'xs+' | 'sm' | 'sm+' | 'md' | 'md+' | 'lg' | 'lg+' | 'xl' | 'xl+' | 'xxl';
    /** Resolution type */
    export type Resolution = ResolutionAlias | CustomResolution;
    /**
     * Convert a resolution type to a (width, height) pair
     * @param resolution resolution type
     * @param aspectRatio desired width / height ratio
     * @returns size in pixels
     */
    export function computeResolution(resolution: Resolution, aspectRatio: number): SpeedySize;
}
declare module "utils/utils" {
    import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { Resolution } from "utils/resolution";
    /**
     * Nullable type
     */
    export type Nullable<T> = T | null;
    /**
     * Generic utilities
     */
    export class Utils {
        /**
         * Log a message
         * @param message
         * @param args optional additional messages
         */
        static log(message: string, ...args: any[]): void;
        /**
         * Display a warning
         * @param message
         * @param args optional additional messages
         */
        static warning(message: string, ...args: any[]): void;
        /**
         * Display an error message
         * @param message
         * @param args optional additional messages
         */
        static error(message: string, ...args: any[]): void;
        /**
         * Assertion
         * @param expr expression
         * @param errorMessage optional error message
         * @throws {AssertionError}
         */
        static assert(expr: boolean, errorMessage?: string): void;
        /**
         * Generate the range [0, 1, ..., n-1]
         * @param n non-negative integer
         * @returns range from 0 to n-1, inclusive, as a new array
         */
        static range(n: number): number[];
        /**
         * Shuffle an array
         * @param arr array to be shuffled in-place
         * @returns shuffled arr
         */
        static shuffle<T>(arr: T[]): T[];
        /**
         * Wait a few milliseconds
         * @param milliseconds how long should we wait?
         * @returns a promise that is resolved soon after the specified time
         */
        static wait(milliseconds: number): SpeedyPromise<void>;
        /**
         * Run SpeedyPromises sequentially
         * @param promises an array of SpeedyPromises
         * @returns a promise that is resolved as soon as all input promises are
         * resolved, or that is rejected as soon as an input promise is rejected
         */
        static runInSequence<T>(promises: SpeedyPromise<T>[]): SpeedyPromise<T>;
        /**
         * Convert a resolution type to a resolution measured in pixels
         * @param resolution resolution type
         * @param aspectRatio width / height ratio
         * @returns resolution measured in pixels
         */
        static resolution(resolution: Resolution, aspectRatio: number): SpeedySize;
        /**
         * Checks if we're on iOS
         * @returns true if we're on iOS
         */
        static isIOS(): boolean;
        /**
         * Checks if we're on a WebKit-based browser
         * @returns true if we're on a WebKit-based browser
         */
        static isWebKit(): boolean;
        /**
         * Device-specific information for debugging purposes
         */
        static deviceInfo(): string;
    }
}
declare module "utils/ar-events" {
    /**
     * AR Event Type
     * @internal
     */
    type AREventType = string;
    /**
     * AR Event
     */
    export class AREvent<T extends AREventType> extends Event {
        /**
         * Constructor
         * @param type event type
         */
        constructor(type: T);
        /**
         * Event type
         */
        get type(): T;
    }
    /**
     * Extract the AREventType from an AREvent
     * @internal
     */
    type AREventTypeOf<T> = T extends AREvent<infer U> ? U : never;
    /**
     * AR Event Listener (a callback)
     * @internal
     */
    interface AREventListener<T> {
        (evt: T extends AREvent<infer U> ? T : never): void;
    }
    /**
     * AR Event Target
     */
    export class AREventTarget<T> {
        /** event target delegate */
        private readonly _delegate;
        /**
         * Constructor
         */
        constructor();
        /**
         * Add event listener
         * @param type event type
         * @param callback
         */
        addEventListener(type: AREventTypeOf<T>, callback: AREventListener<T>): void;
        /**
         * Remove event listener
         * @param type event type
         * @param callback
         */
        removeEventListener(type: AREventTypeOf<T>, callback: AREventListener<T>): void;
        /**
         * Synchronously trigger an event
         * @param event
         * @returns same value as a standard event target
         * @internal
         */
        dispatchEvent(event: T extends AREvent<infer U> ? T : never): boolean;
    }
}
declare module "sources/canvas-source" {
    import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { Nullable } from "utils/utils";
    import { Source, SourceType } from "sources/source";
    /**
     * HTMLCanvasElement-based source of data
     */
    export class CanvasSource implements Source {
        /** canvas element */
        private _canvas;
        /** media source */
        protected _media: Nullable<SpeedyMedia>;
        /**
         * Constructor
         */
        constructor(canvas: HTMLCanvasElement);
        /**
         * The underlying <canvas> element
         */
        get canvas(): HTMLCanvasElement;
        /**
         * Check if this source is of a certain type
         * @internal
         */
        _is<T extends keyof SourceType>(type: T): this is SourceType[T];
        /**
         * Get media
         * @internal
         */
        get _internalMedia(): SpeedyMedia;
        /**
         * Stats related to this source of data
         * @internal
         */
        get _stats(): string;
        /**
         * Initialize this source of data
         * @returns a promise that resolves as soon as this source of data is initialized
         * @internal
         */
        _init(): SpeedyPromise<void>;
        /**
         * Release this source of data
         * @returns a promise that resolves as soon as this source of data is released
         * @internal
         */
        _release(): SpeedyPromise<void>;
    }
}
declare module "sources/pointer-source" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { Source, SourceType } from "sources/source";
    import { Viewport } from "core/viewport";
    /**
     * Source of data of pointer-based input: mouse, touch, pen...
     */
    export class PointerSource implements Source {
        /** a queue of incoming pointer events */
        private _queue;
        /** the viewport linked to this source of data */
        private _viewport;
        /**
         * Constructor
         */
        constructor();
        /**
         * Check if this source is of a certain type
         * @internal
         */
        _is<T extends keyof SourceType>(type: T): this is SourceType[T];
        /**
         * Consume a pointer event
         * @returns the next pointer event to be consumed, or null if there are none
         * @internal
         */
        _consume(): PointerEvent | null;
        /**
         * Stats related to this source of data
         * @internal
         */
        get _stats(): string;
        /**
         * Initialize this source of data
         * @returns a promise that resolves as soon as this source of data is initialized
         * @internal
         */
        _init(): SpeedyPromise<void>;
        /**
         * Release this source of data
         * @returns a promise that resolves as soon as this source of data is released
         * @internal
         */
        _release(): SpeedyPromise<void>;
        /**
         * Link a viewport to this source of data
         * @param viewport possibly null
         * @internal
         */
        _setViewport(viewport: Viewport | null): void;
        /**
         * Event handler
         * @param event
         */
        private _onPointerEvent;
        /**
         * Cancel event
         * @param event
         */
        private _cancelEvent;
        /**
         * Add event listeners
         * @param canvas
         */
        private _addEventListeners;
        /**
         * Remove event listeners
         * @param canvas
         */
        private _removeEventListeners;
    }
}
declare module "sources/source" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { CanvasSource } from "sources/canvas-source";
    import { PointerSource } from "sources/pointer-source";
    import { VideoSource } from "sources/video-source";
    /**
     * Abstract source of data
     */
    export interface Source {
        /** @internal check if this source is of a certain type */
        _is<T extends keyof SourceType>(type: T): this is SourceType[T];
        /** @internal method to initialize the source of data (gets the data ready) */
        _init(): SpeedyPromise<void>;
        /** @internal method to release the source of data */
        _release(): SpeedyPromise<void>;
        /** @internal stats related to this source of data */
        readonly _stats: string;
    }
    /**
     * A helper for type-narrowing
     * @internal
     */
    export type SourceType = {
        'video-source': VideoSource;
        'canvas-source': CanvasSource;
        'pointer-source': PointerSource;
    };
}
declare module "sources/video-source" {
    import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { Nullable } from "utils/utils";
    import { Source, SourceType } from "sources/source";
    /**
     * HTMLVideoElement-based source of data
     */
    export class VideoSource implements Source {
        /** video element */
        private _video;
        /** media source */
        protected _media: Nullable<SpeedyMedia>;
        /**
         * Constructor
         */
        constructor(video: HTMLVideoElement);
        /**
         * The underlying <video> element
         */
        get video(): HTMLVideoElement;
        /**
         * Check if this source is of a certain type
         * @internal
         */
        _is<T extends keyof SourceType>(type: T): this is SourceType[T];
        /**
         * Get media
         * @internal
         */
        get _internalMedia(): SpeedyMedia;
        /**
         * Stats related to this source of data
         * @internal
         */
        get _stats(): string;
        /**
         * Initialize this source of data
         * @returns a promise that resolves as soon as this source of data is initialized
         * @internal
         */
        _init(): SpeedyPromise<void>;
        /**
         * Release this source of data
         * @returns a promise that resolves as soon as this source of data is released
         * @internal
         */
        _release(): SpeedyPromise<void>;
        /**
         * Handle browser-specific quirks for <video> elements
         * @param video a video element
         * @returns a promise that resolves to the input video
         */
        private _prepareVideo;
        /**
         * Handle browser-specific quirks for videos marked with autoplay
         * @param video a <video> marked with autoplay
         * @returns a promise that resolves to the input video
         */
        private _handleAutoPlay;
        /**
         * Wait for the input video to be playable
         * @param video
         * @returns a promise that resolves to the input video when it can be played
         */
        private _waitUntilPlayable;
    }
}
declare module "trackers/image-tracker/reference-image" {
    import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
    type ReferenceImageType = HTMLImageElement | ImageBitmap | ImageData;
    /**
     * Reference Image for tracking
     */
    export interface ReferenceImage {
        /** Reference Images should have unique names given by the user */
        name?: string;
        /** Image data */
        readonly image: ReferenceImageType;
    }
    /**
     * A ReferenceImage decorated with a SpeedyMedia
     */
    export class ReferenceImageWithMedia implements ReferenceImage {
        /** The decorated reference image */
        private readonly _referenceImage;
        /** A SpeedyMedia corresponding to the reference image */
        private readonly _media;
        /** The aspect ratio of the reference image */
        private readonly _aspectRatio;
        /**
         * Constructor
         * @param referenceImage
         * @param media
         */
        constructor(referenceImage: ReferenceImage, media: SpeedyMedia);
        /**
         * Getter of the name of the reference image
         */
        get name(): string;
        /**
         * Setter of the name of the reference image
         */
        set name(name: string);
        /**
         * Image data
         */
        get image(): ReferenceImageType;
        /**
         * A SpeedyMedia corresponding to the reference media
         */
        get media(): SpeedyMedia;
        /**
         * The aspect ratio of the reference image
         */
        get aspectRatio(): number;
        /**
         * Generate a unique name for a reference image
         * @returns a unique name
         */
        private _generateUniqueName;
    }
}
declare module "trackers/image-tracker/reference-image-database" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { ReferenceImage, ReferenceImageWithMedia } from "trackers/image-tracker/reference-image";
    /**
     * A collection of Reference Images
     */
    export class ReferenceImageDatabase implements Iterable<ReferenceImage> {
        /** Entries */
        private _entries;
        /** Maximum number of entries */
        private _capacity;
        /** Is the database locked? */
        private _locked;
        /**
         * Constructor
         */
        constructor();
        /**
         * The number of reference images stored in this database
         */
        get count(): number;
        /**
         * Maximum number of elements
         */
        get capacity(): number;
        /**
         * Maximum number of elements
         * Increasing the capacity is considered experimental
         */
        set capacity(value: number);
        /**
         * Iterates over the collection
         */
        [Symbol.iterator](): Iterator<ReferenceImageWithMedia>;
        /**
         * Add reference images to this database
         * Add only the images you actually need to track!
         * (each image take up storage space)
         * @param referenceImages one or more reference images with unique names (a unique name will
         *                        be generated automatically if you don't specify one)
         * @returns a promise that resolves as soon as the images are loaded and added to this database
         */
        add(referenceImages: ReferenceImage[]): SpeedyPromise<void>;
        /**
         * Add a single preloaded reference image to the database
         * @param referenceImage
         */
        _addOne(referenceImage: ReferenceImageWithMedia): void;
        /**
         * Lock the database, so that new reference images can no longer be added to it
         * @internal
         */
        _lock(): void;
        /**
         * Get reference image by name
         * @param name
         * @returns the reference image with the given name, or null if there isn't any
         * @internal
         */
        _find(name: string): ReferenceImageWithMedia | null;
        /**
         * Load a reference image
         * @param referenceImage
         * @returns a promise that resolves to a corresponding ReferenceImageWithMedia
         */
        private _preloadOne;
        /**
         * Load multiple reference images
         * @param referenceImages
         * @returns a promise that resolves to corresponding ReferenceImageWithMedia objects
         */
        private _preloadMany;
    }
}
declare module "trackers/image-tracker/states/state" {
    import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
    import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
    import { ImageTracker, ImageTrackerOutput, ImageTrackerStateName } from "trackers/image-tracker/image-tracker";
    /** State output */
    export interface ImageTrackerStateOutput {
        readonly trackerOutput: ImageTrackerOutput;
        readonly nextState: ImageTrackerStateName;
        readonly nextStateSettings?: Record<string, any>;
    }
    /**
     * Abstract state of the Image Tracker
     */
    export abstract class ImageTrackerState {
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
        constructor(name: ImageTrackerStateName, imageTracker: ImageTracker);
        /**
         * State name
         */
        get name(): ImageTrackerStateName;
        /**
         * AR screen size
         * It may change over time, as when flipping a phone
         */
        get screenSize(): SpeedySize;
        /**
         * Initialize the state
         */
        init(): void;
        /**
         * Release resources
         */
        release(): null;
        /**
         * Update the state
         * @param media user media
         * @param screenSize AR screen size for image processing
         * @param state all states
         * @returns promise
         */
        update(media: SpeedyMedia, screenSize: SpeedySize): SpeedyPromise<ImageTrackerStateOutput>;
        /**
         * Called as soon as this becomes the active state, just before update() runs for the first time
         * @param settings
         */
        onEnterState(settings: Record<string, any>): void;
        /**
         * Called when leaving the state, after update()
         */
        onLeaveState(): void;
        /**
         * Called just before the GPU processing
         * @returns promise
         */
        protected _beforeUpdate(): SpeedyPromise<void>;
        /**
         * GPU processing
         * @returns promise with the pipeline results
         */
        protected _gpuUpdate(): SpeedyPromise<SpeedyPipelineOutput>;
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
}
declare module "trackers/image-tracker/settings" {
    /** Maximum number of keypoints to be stored for each reference image when in the training state */
    export const TRAIN_MAX_KEYPOINTS = 1024;
    /** Percentage relative to the screen size adjusted to the aspect ratio of the reference image */
    export const TRAIN_IMAGE_SCALE = 0.8;
    /** Width and height of the Normalized Image Space (NIS) */
    export const NIS_SIZE = 1024;
    /** Used to identify the best maches */
    export const SCAN_MATCH_RATIO = 0.7;
    /** Maximum number of keypoints to be analyzed when in the scanning state */
    export const SCAN_MAX_KEYPOINTS = 512;
    /** Number of pyramid levels to be scanned by the corner detector when in the scanning & training states */
    export const SCAN_PYRAMID_LEVELS = 4;
    /** Scale factor between pyramid levels to be scanned by the corner detector when in the scanning & training states */
    export const SCAN_PYRAMID_SCALEFACTOR = 1.19;
    /** Threshold of the FAST corner detector used in the scanning/training states */
    export const SCAN_FAST_THRESHOLD = 60;
    /** Minimum number of accepted matches for us to move out of the scanning state */
    export const SCAN_MIN_MATCHES = 20;
    /** When in the scanning state, we require the image to be matched during a few consecutive frames before accepting it */
    export const SCAN_CONSECUTIVE_FRAMES = 30;
    /** Reprojection error, in NIS pixels, used when estimating a motion model (scanning state) */
    export const SCAN_RANSAC_REPROJECTIONERROR_NIS: number;
    /** Reprojection error, in NDC, used when estimating a motion model (scanning state) */
    export const SCAN_RANSAC_REPROJECTIONERROR_NDC: number;
    /** Number of tables used in the LSH-based keypoint matching */
    export const SCAN_LSH_TABLES = 8;
    /** Hash size, in bits, used in the LSH-based keypoint matching */
    export const SCAN_LSH_HASHSIZE = 15;
    /** Use the Nightvision filter when in the scanning/training state? */
    export const SCAN_WITH_NIGHTVISION = true;
    /** Nightvision filter: gain */
    export const NIGHTVISION_GAIN = 0.3;
    /** Nightvision filter: offset */
    export const NIGHTVISION_OFFSET = 0.5;
    /** Nightvision filter: decay */
    export const NIGHTVISION_DECAY = 0;
    /** Nightvision filter: quality level */
    export const NIGHTVISION_QUALITY = "low";
    /** Kernel size (square) of the Gaussian filter applied before computing the ORB descriptors */
    export const ORB_GAUSSIAN_KSIZE = 9;
    /** Sigma of the Gaussian filter applied before computing the ORB descriptors */
    export const ORB_GAUSSIAN_SIGMA = 2;
    /** Kernel size (square) of the Gaussian filter applied before subpixel refinement for noise reduction */
    export const SUBPIXEL_GAUSSIAN_KSIZE = 5;
    /** Sigma of the Gaussian filter applied before subpixel refinement for noise reduction */
    export const SUBPIXEL_GAUSSIAN_SIGMA = 1;
    /** Subpixel refinement method */
    export const SUBPIXEL_METHOD = "bilinear-upsample";
    /** Minimum acceptable number of matched keypoints when in a pre-tracking state */
    export const PRE_TRACK_MIN_MATCHES = 4;
    /** Used to identify the best maches */
    export const PRE_TRACK_MATCH_RATIO = 0.6;
    /** Reprojection error, in NIS pixels, used when pre-tracking */
    export const PRE_TRACK_RANSAC_REPROJECTIONERROR_NIS: number;
    /** Reprojection error, in NDC, used when pre-tracking */
    export const PRE_TRACK_RANSAC_REPROJECTIONERROR_NDC: number;
    /** Interpolation filter: interpolation factor */
    export const PRE_TRACK_FILTER_ALPHA = 0.8;
    /** Interpolation filter: correction strength for noisy corners */
    export const PRE_TRACK_FILTER_BETA = 1;
    /** Maximum number of iterations in Pre-tracking B */
    export const PRE_TRACK_MAX_ITERATIONS = 8;
    /** Minimum acceptable number of matched keypoints when in the tracking state */
    export const TRACK_MIN_MATCHES = 4;
    /** Maximum number of keypoints to be analyzed in the tracking state */
    export const TRACK_MAX_KEYPOINTS = 200;
    /** Capacity of the keypoint detector used in the the tracking state */
    export const TRACK_DETECTOR_CAPACITY = 2048;
    /** Quality of the Harris/Shi-Tomasi corner detector */
    export const TRACK_HARRIS_QUALITY = 0.005;
    /** Use the Nightvision filter when in the tracking state? */
    export const TRACK_WITH_NIGHTVISION = false;
    /** Relative size (%) of the (top, right, bottom, left) borders of the rectified image */
    export const TRACK_RECTIFIED_BORDER = 0.15;
    /** Relative size (%) used to clip keypoints from the borders of the rectified image */
    export const TRACK_CLIPPING_BORDER: number;
    /** Scale of the rectified image in NDC, without taking the aspect ratio into consideration */
    export const TRACK_RECTIFIED_SCALE: number;
    /** Reprojection error, in NIS pixels, used when estimating a motion model (tracking state) */
    export const TRACK_RANSAC_REPROJECTIONERROR_NIS: number;
    /** Reprojection error, in NDC, used when estimating a motion model (tracking state) */
    export const TRACK_RANSAC_REPROJECTIONERROR_NDC: number;
    /** We use a N x N grid to spatially distribute the keypoints in order to compute a better homography */
    export const TRACK_GRID_GRANULARITY = 15;
    /** Used to identify the best maches */
    export const TRACK_MATCH_RATIO = 0.7;
    /** Number of consecutive frames in which we tolerate a  "target lost" situation */
    export const TRACK_LOST_TOLERANCE = 20;
    /** Interpolation filter: interpolation factor */
    export const TRACK_FILTER_ALPHA = 0.3;
    /** Interpolation filter: correction strength for noisy corners */
    export const TRACK_FILTER_BETA = 1;
    /** Extrapolation filter: extrapolation factor */
    export const TRACK_EXTRAPOLATION_ALPHA = 6;
    /** Extrapolation filter: correction strength for noisy corners */
    export const TRACK_EXTRAPOLATION_BETA = 1.33;
}
declare module "trackers/image-tracker/states/initial" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
    import { ImageTracker } from "trackers/image-tracker/image-tracker";
    import { ImageTrackerState, ImageTrackerStateOutput } from "trackers/image-tracker/states/state";
    /**
     * The purpose of the initial state of the Image Tracker
     * is to initialize the training state using the state machine
     */
    export class ImageTrackerInitialState extends ImageTrackerState {
        /**
         * Constructor
         * @param imageTracker
         */
        constructor(imageTracker: ImageTracker);
        /**
         * Called just before the GPU processing
         * @returns promise
         */
        protected _beforeUpdate(): SpeedyPromise<void>;
        /**
         * Post processing that takes place just after the GPU processing
         * @param result pipeline results
         * @returns state output
         */
        protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>;
        /**
         * Called when leaving the state, after update()
         */
        onLeaveState(): void;
        /**
         * Create & setup the pipeline
         * @returns pipeline
         */
        protected _createPipeline(): SpeedyPipeline;
    }
}
declare module "geometry/pnp" {
    import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { Nullable } from "utils/utils";
    /** Options for the RANSAC scheme */
    export interface solvePlanarPnPRansacOptions {
        /** maximum number of models to be generated */
        numberOfHypotheses?: number;
        /** reprojection error threshold for a point to be considered an outlier */
        reprojectionError?: number;
        /** a value used to exit early if a good percentage of inliers is found */
        acceptablePercentageOfInliers?: number;
        /** output mask of inliers */
        mask?: Nullable<SpeedyMatrix>;
    }
    /** Options for find6DoFHomography() */
    export interface find6DoFHomographyOptions extends solvePlanarPnPRansacOptions {
        /** quality of the refinement: a value in [0,1] */
        refinementQuality?: number;
    }
    /**
     * Perspective-N-Point for planar tracking. Requires n >= 4 points.
     * @param referencePoints 2 x n matrix with reference points in a plane parallel to the image plane (Z = z0 > 0)
     * @param observedPoints 2 x n matrix with the observed points corresponding to the reference points
     * @param cameraIntrinsics 3x3 matrix
     * @returns 3x4 [ R | t ] matrix describing the pose of the planar target in view space, or a matrix of NaNs if no pose is found
     */
    export function solvePlanarPnP(referencePoints: SpeedyMatrix, observedPoints: SpeedyMatrix, cameraIntrinsics: SpeedyMatrix): SpeedyMatrix;
    /**
     * Perspective-N-Point for planar tracking with RANSAC. Requires n >= 4 points.
     * @param referencePoints 2 x n matrix with reference points in a plane parallel to the image plane (Z = z0 > 0)
     * @param observedPoints 2 x n matrix with the observed points corresponding to the reference points
     * @param cameraIntrinsics 3x3 matrix
     * @param options RANSAC options
     * @returns 3x4 [ R | t ] matrix describing the pose of the planar target in view space, or a matrix of NaNs if no pose is found
     */
    export function solvePlanarPnPRansac(referencePoints: SpeedyMatrix, observedPoints: SpeedyMatrix, cameraIntrinsics: SpeedyMatrix, options?: solvePlanarPnPRansacOptions): SpeedyMatrix;
    /**
     * Find a homography matrix with 6 degrees of freedom (rotation and translation) instead of the usual 8 of the DLT
     * @param referencePoints 2 x n matrix with reference points in a plane parallel to the image plane (Z = z0 > 0)
     * @param observedPoints 2 x n matrix with the observed points corresponding to the reference points
     * @param cameraIntrinsics 3x3 matrix
     * @param options options
     * @returns 3x3 homography matrix or a matrix of NaNs if no suitable homography is found
     */
    export function find6DoFHomography(referencePoints: SpeedyMatrix, observedPoints: SpeedyMatrix, cameraIntrinsics: SpeedyMatrix, options?: find6DoFHomographyOptions): SpeedyPromise<SpeedyMatrix>;
}
declare module "trackers/image-tracker/image-tracker-utils" {
    import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
    import { SpeedyPoint2 } from 'speedy-vision/types/core/speedy-point';
    import { SpeedyKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
    import { ReferenceImageWithMedia } from "trackers/image-tracker/reference-image";
    import { find6DoFHomographyOptions } from "geometry/pnp";
    /** An ordered pair [src, dest] of keypoints */
    export type ImageTrackerKeypointPair = [Readonly<SpeedyKeypoint>, Readonly<SpeedyKeypoint>];
    /**
     * Utilities for the Image Tracker
     */
    export class ImageTrackerUtils {
        /**
         * Find a transformation that converts a raster space to NIS
         * @param size size of the raster space
         * @returns a 3x3 matrix
         */
        static rasterToNIS(size: SpeedySize): SpeedyMatrix;
        /**
         * Find a transformation that converts a raster space to NDC
         * @param size size of the raster space
         * @returns a 3x3 matrix
         */
        static rasterToNDC(size: SpeedySize): SpeedyMatrix;
        /**
         * Find a transformation that converts NDC to a raster space
         * @param size size of the raster space
         * @returns a 3x3 matrix
         */
        static NDCToRaster(size: SpeedySize): SpeedyMatrix;
        /**
         * Find a transformation that scales points in NDC
         * @param sx horizontal scale factor
         * @param sy vertical scale factor
         * @returns a 3x3 matrix
         */
        static scaleNDC(sx: number, sy?: number): SpeedyMatrix;
        /**
         * Find a scale transformation in NDC such that the output has a desired aspect ratio
         * @param aspectRatio desired aspect ratio
         * @param scale optional scale factor in both axes
         * @returns a 3x3 matrix
         */
        static bestFitScaleNDC(aspectRatio: number, scale?: number): SpeedyMatrix;
        /**
         * Find the inverse matrix of bestFitScaleNDC()
         * @param aspectRatio as given to bestFitScaleNDC()
         * @param scale optional, as given to bestFitScaleNDC()
         * @returns a 3x3 matrix
         */
        static inverseBestFitScaleNDC(aspectRatio: number, scale?: number): SpeedyMatrix;
        /**
         * Find the best-fit aspect ratio for the rectification of the reference image in NDC
         * @param screenSize
         * @param referenceImage
         * @returns a best-fit aspect ratio
         */
        static bestFitAspectRatioNDC(screenSize: SpeedySize, referenceImage: ReferenceImageWithMedia): number;
        /**
         * Given n > 0 pairs (src_i, dest_i) of keypoints in NIS,
         * convert them to NDC and output a 2 x 2n matrix of the form:
         * [ src_0.x  src_1.x  ... | dest_0.x  dest_1.x  ... ]
         * [ src_0.y  src_1.y  ... | dest_0.y  dest_1.y  ... ]
         * @param pairs pairs of keypoints in NIS
         * @returns 2 x 2n matrix with two 2 x n blocks: [ src | dest ]
         * @throws
         */
        static compilePairsOfKeypointsNDC(pairs: ImageTrackerKeypointPair[]): SpeedyMatrix;
        /**
         * Interpolation filter for homographies
         * In its simplest form, it's similar to linear interpolation: src (1-alpha) + dest alpha
         * @param src homography
         * @param dest homography
         * @param alpha interpolation factor in [0,1] (1 means no interpolation)
         * @param beta correction strength for noisy corners (optional)
         * @param tau translation factor (optional)
         * @param omega rotational factor (optional)
         * @returns interpolated homography
         */
        static interpolateHomographies(src: SpeedyMatrix, dest: SpeedyMatrix, alpha: number, beta?: number, tau?: number, omega?: number): SpeedyPromise<SpeedyMatrix>;
        /**
         * Given n > 0 pairs of keypoints in NDC as a 2 x 2n [ src | dest ] matrix,
         * find a 6 DoF perspective warp (homography) from src to dest in NDC
         * @param cameraIntrinsics 3x3 camera intrinsics
         * @param points compiled pairs of keypoints in NDC
         * @param options to be passed to find6DofHomography
         * @returns a pair [ 3x3 transformation matrix, quality score ]
         */
        static find6DoFHomographyNDC(cameraIntrinsics: SpeedyMatrix, points: SpeedyMatrix, options: find6DoFHomographyOptions): SpeedyPromise<[SpeedyMatrix, number]>;
        /**
         * Given n > 0 pairs of keypoints in NDC as a 2 x 2n [ src | dest ] matrix,
         * find a perspective warp (homography) from src to dest in NDC
         * @param points compiled pairs of keypoints in NDC
         * @param options to be passed to speedy-vision
         * @returns a pair [ 3x3 transformation matrix, quality score ]
         */
        static findPerspectiveWarpNDC(points: SpeedyMatrix, options: object): SpeedyPromise<[SpeedyMatrix, number]>;
        /**
         * Given n > 0 pairs of keypoints in NDC as a 2 x 2n [ src | dest ] matrix,
         * find an affine warp from src to dest in NDC. The affine warp is given as
         * a 3x3 matrix whose last row is [0 0 1]
         * @param points compiled pairs of keypoints in NDC
         * @param options to be passed to speedy-vision
         * @returns a pair [ 3x3 transformation matrix, quality score ]
         */
        static findAffineWarpNDC(points: SpeedyMatrix, options: object): SpeedyPromise<[SpeedyMatrix, number]>;
        /**
         * Find a polyline in Normalized Device Coordinates (NDC)
         * @param homography maps the corners of NDC to a quadrilateral in NDC
         * @returns 4 points in NDC
         */
        static findPolylineNDC(homography: SpeedyMatrix): SpeedyPoint2[];
        /**
         * Find a better spatial distribution of the input matches
         * @param pairs in the [src, dest] format
         * @returns refined pairs of quality matches
         */
        static refineMatchingPairs(pairs: ImageTrackerKeypointPair[]): ImageTrackerKeypointPair[];
        /**
         * Spatially distribute keypoints over a grid
         * @param keypoints keypoints to be distributed
         * @returns a list of indices of keypoints[]
         */
        private static _distributeKeypoints;
        /**
         * Normalize points to [0,1)^2
         * @param points 2 x n matrix of points in column-major format
         * @returns points
         */
        private static _normalizePoints;
    }
}
declare module "trackers/image-tracker/states/training" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
    import { SpeedyKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
    import { ImageTracker } from "trackers/image-tracker/image-tracker";
    import { ImageTrackerState, ImageTrackerStateOutput } from "trackers/image-tracker/states/state";
    import { ReferenceImageWithMedia } from "trackers/image-tracker/reference-image";
    import { Nullable } from "utils/utils";
    /**
     * Training state of the Image Tracker
     */
    export class ImageTrackerTrainingState extends ImageTrackerState {
        /** index of the image being used to train the tracker */
        private _currentImageIndex;
        /** training map */
        private _trainingMap;
        /**
         * Constructor
         * @param imageTracker
         */
        constructor(imageTracker: ImageTracker);
        /**
         * Called as soon as this becomes the active state, just before update() runs for the first time
         * @param settings
         */
        onEnterState(settings: Record<string, any>): void;
        /**
         * Called when leaving the state, after update()
         */
        onLeaveState(): void;
        /**
         * Called just before the GPU processing
         * @returns promise
         */
        protected _beforeUpdate(): SpeedyPromise<void>;
        /**
         * Post processing that takes place just after the GPU processing
         * @param result pipeline results
         * @returns state output
         */
        protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>;
        /**
         * Create & setup the pipeline
         * @returns pipeline
         */
        protected _createPipeline(): SpeedyPipeline;
        /**
         * Get the reference image associated with a keypoint index in the training map
         * @param keypointIndex -1 if not found
         * @returns reference image
         */
        referenceImageOfKeypoint(keypointIndex: number): Nullable<ReferenceImageWithMedia>;
        /**
         * Get the reference image index associated with a keypoint index in the training map
         * @param keypointIndex -1 if not found
         * @returns reference image index, or -1 if not found
         */
        referenceImageIndexOfKeypoint(keypointIndex: number): number;
        /**
         * Get a keypoint of the trained set
         * @param keypointIndex -1 if not found
         * @returns a keypoint
         */
        referenceKeypoint(keypointIndex: number): Nullable<SpeedyKeypoint>;
    }
}
declare module "trackers/image-tracker/states/scanning" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
    import { ImageTracker } from "trackers/image-tracker/image-tracker";
    import { ImageTrackerState, ImageTrackerStateOutput } from "trackers/image-tracker/states/state";
    /**
     * In the scanning state we look for a reference image in the video
     */
    export class ImageTrackerScanningState extends ImageTrackerState {
        /** counts consecutive frames (matching) */
        private _counter;
        /** best homography matrix found so far */
        private _bestHomography;
        /** score related to the number of inliers (for robust homography estimation) */
        private _bestScore;
        /**
         * Constructor
         * @param imageTracker
         */
        constructor(imageTracker: ImageTracker);
        /**
         * Called as soon as this becomes the active state, just before update() runs for the first time
         * @param settings
         */
        onEnterState(settings: Record<string, any>): void;
        /**
         * Called just before the GPU processing
         * @returns promise
         */
        protected _beforeUpdate(): SpeedyPromise<void>;
        /**
         * Post processing that takes place just after the GPU processing
         * @param result pipeline results
         * @returns state output
         */
        protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>;
        /**
         * Select high quality matches of a single reference image
         * @param keypoints matched keypoints of any quality, to any reference image
         * @returns high quality matches of a single reference image
         */
        private _selectGoodMatches;
        /**
         * Find a homography matrix using matched keypoints in NDC
         * @param points compiled pairs of keypoints in NDC
         * @returns homography (from reference to matched, NDC) & "quality" score
         */
        private _findHomographyNDC;
        /**
         * Find matching pairs of keypoints from reference image (src) to matched image (dest)
         * @param matchedKeypoints
         * @returns an array of matching pairs [src, dest]
         */
        private _findMatchingPairs;
        /**
         * Create & setup the pipeline
         * @returns pipeline
         */
        protected _createPipeline(): SpeedyPipeline;
    }
}
declare module "trackers/image-tracker/states/pre-tracking-a" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
    import { ImageTracker } from "trackers/image-tracker/image-tracker";
    import { ImageTrackerState, ImageTrackerStateOutput } from "trackers/image-tracker/states/state";
    /**
     * Pre-Tracking A is a new training phase. The reference image that was found
     * in the scanning state is transported to AR screen space, and a new training
     * takes place there, with new keypoints and in a suitable warp.
     */
    export class ImageTrackerPreTrackingAState extends ImageTrackerState {
        /** reference image */
        private _referenceImage;
        /** a snapshot of the video from the scanning state and corresponding to the initial homography */
        private _snapshot;
        /** initial homography, from reference image to scanned image, NDC */
        private _homography;
        /**
         * Constructor
         * @param imageTracker
         */
        constructor(imageTracker: ImageTracker);
        /**
         * Called as soon as this becomes the active state, just before update() runs for the first time
         * @param settings
         */
        onEnterState(settings: Record<string, any>): void;
        /**
         * Called just before the GPU processing
         * @returns promise
         */
        protected _beforeUpdate(): SpeedyPromise<void>;
        /**
         * Post processing that takes place just after the GPU processing
         * @param result pipeline results
         * @returns state output
         */
        protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>;
        /**
         * Create & setup the pipeline
         * @returns pipeline
         */
        protected _createPipeline(): SpeedyPipeline;
    }
}
declare module "trackers/image-tracker/states/pre-tracking-b" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
    import { ImageTracker } from "trackers/image-tracker/image-tracker";
    import { ImageTrackerState, ImageTrackerStateOutput } from "trackers/image-tracker/states/state";
    /**
     * In Pre-Tracking B, we refine the homography obtained at the scanning state.
     * We find a transformation that warps the snapshot obtained from the scanning
     * state to an image that closely resembles the output of Pre-Tracking A.
     */
    export class ImageTrackerPreTrackingBState extends ImageTrackerState {
        /** reference image */
        private _referenceImage;
        /** a snapshot of the video from the scanning state and corresponding to the initial homography */
        private _snapshot;
        /** initial homography, from reference image to scanned image, NDC */
        private _homography;
        /** portal with keypoints from Pre-Tracking A */
        private _referenceKeypointPortalSink;
        /** number of iterations */
        private _iterations;
        /**
         * Constructor
         * @param imageTracker
         */
        constructor(imageTracker: ImageTracker);
        /**
         * Called as soon as this becomes the active state, just before update() runs for the first time
         * @param settings
         */
        onEnterState(settings: Record<string, any>): void;
        /**
         * Called just before the GPU processing
         * @returns promise
         */
        protected _beforeUpdate(): SpeedyPromise<void>;
        /**
         * Post processing that takes place just after the GPU processing
         * @param result pipeline results
         * @returns state output
         */
        protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>;
        /**
         * Find a motion model in NDC between pairs of keypoints in NDC
         * given as a 2 x 2n [ src | dest ] matrix
         * @param points compiled pairs of keypoints in NDC
         * @returns a promise that resolves to a 3x3 warp in NDC that maps source to destination
         */
        private _findMotionNDC;
        /**
         * Find matching pairs of two sets of keypoints matched via brute force
         * @param srcKeypoints source (database)
         * @param destKeypoints destination
         * @returns an array of matching pairs [src, dest]
         */
        private _findMatchingPairs;
        /**
         * Create & setup the pipeline
         * @returns pipeline
         */
        protected _createPipeline(): SpeedyPipeline;
    }
}
declare module "trackers/image-tracker/image-tracker-event" {
    import { ReferenceImage } from "trackers/image-tracker/reference-image";
    import { AREvent } from "utils/ar-events";
    /** All possible event types emitted by an Image Tracker */
    export type ImageTrackerEventType = 'targetfound' | 'targetlost';
    /**
     * An event emitted by an Image Tracker
     */
    export class ImageTrackerEvent extends AREvent<ImageTrackerEventType> {
        private _referenceImage;
        /**
         * Constructor
         * @param type event type
         * @param referenceImage optional reference image
         */
        constructor(type: ImageTrackerEventType, referenceImage: ReferenceImage);
        /**
         * Reference image
         */
        get referenceImage(): ReferenceImage;
    }
}
declare module "geometry/vector3" {
    import { Quaternion } from "geometry/quaternion";
    /**
     * A vector in 3D space
     */
    export class Vector3 {
        /** x coordinate */
        private _x;
        /** y coordinate */
        private _y;
        /** z coordinate */
        private _z;
        /**
         * Constructor
         */
        constructor(x?: number, y?: number, z?: number);
        /**
         * Instantiate a zero vector
         * @returns a new zero vector
         */
        static Zero(): Vector3;
        /**
         * Immutable zero vector
         * @returns an immutable zero vector
         */
        static get ZERO(): Vector3;
        /**
         * The x coordinate of the vector
         */
        get x(): number;
        /**
         * The y coordinate of the vector
         */
        get y(): number;
        /**
         * The z coordinate of the vector
         */
        get z(): number;
        /**
         * The length of this vector
         * @returns sqrt(x^2 + y^2 + z^2)
         */
        length(): number;
        /**
         * Compute the dot product of this and v
         * @param v a vector
         * @returns the dot product of the vectors
         */
        dot(v: Vector3): number;
        /**
         * Compute the distance between points this and v
         * @param v a vector / point
         * @returns the distance between the points
         */
        distanceTo(v: Vector3): number;
        /**
         * Compute the direction from this to v
         * @param v a vector
         * @returns a new unit vector pointing to v from this
         */
        directionTo(v: Vector3): Vector3;
        /**
         * The cross product of this and v
         * @param v a vector
         * @returns the cross product this x v
         */
        cross(v: Vector3): Vector3;
        /**
         * Compute a unit vector with the same direction as this
         * @returns a new unit vector with the same direction as this
         */
        normalized(): Vector3;
        /**
         * Compute the sum between this vector and v
         * @param v a vector
         * @returns a new vector equal to the sum between this and v
         */
        plus(v: Vector3): Vector3;
        /**
         * Compute the difference between this vector and v
         * @param v a vector
         * @returns a new vector equal to the difference this - v
         */
        minus(v: Vector3): Vector3;
        /**
         * Compute the multiplication between this vector and a scale factor
         * @param scale scalar quantity
         * @returns a new vector equal to the multiplication between this and the scale factor
         */
        times(scale: number): Vector3;
        /**
         * Check if this and v have the same coordinates
         * @param v a vector
         * @returns true if this and v have the same coordinates
         */
        equals(v: Vector3): boolean;
        /**
         * Convert to string
         * @returns a string
         */
        toString(): string;
        /**
         * Set the coordinates of this vector
         * @param x x-coordinate
         * @param y y-coordinate
         * @param z z-coordinate
         * @returns this vector
         * @internal
         */
        _set(x: number, y: number, z: number): Vector3;
        /**
         * Copy v to this
         * @param v a vector
         * @returns this vector
         * @internal
         */
        _copyFrom(v: Vector3): Vector3;
        /**
         * Normalize this vector
         * @returns this vector, normalized
         * @internal
         */
        _normalize(): Vector3;
        /**
         * Add v to this vector
         * @param v a vector
         * @returns this vector
         * @internal
         */
        _add(v: Vector3): Vector3;
        /**
         * Subtract v from this vector
         * @param v a vector
         * @returns this vector
         * @internal
         */
        _subtract(v: Vector3): Vector3;
        /**
         * Scale this vector by a scalar
         * @param s scalar
         * @returns this vector
         * @internal
         */
        _scale(s: number): Vector3;
        /**
         * Compute the rotation q p q* in place, where q is a unit quaternion,
         * q* is its conjugate and multiplicative inverse, and p is this vector
         * @param q unit quaternion
         * @returns this vector
         * @internal
         */
        _applyRotationQuaternion(q: Quaternion): Vector3;
        /**
         * Clone this vector
         * @returns a clone of this vector
         * @internal
         */
        _clone(): Vector3;
    }
}
declare module "geometry/quaternion" {
    import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
    import { Vector3 } from "geometry/vector3";
    /**
     * Quaternion q = x i + y j + z k + w
     */
    export class Quaternion {
        /** x coordinate (imaginary) */
        private _x;
        /** y coordinate (imaginary) */
        private _y;
        /** z coordinate (imaginary) */
        private _z;
        /** w coordinate (real) */
        private _w;
        /**
         * Constructor
         * @param x x coordinate (imaginary)
         * @param y y coordinate (imaginary)
         * @param z z coordinate (imaginary)
         * @param w w coordinate (real)
         */
        constructor(x?: number, y?: number, z?: number, w?: number);
        /**
         * Instantiate an identity quaternion q = 1
         * @returns a new identity quaternion
         */
        static Identity(): Quaternion;
        /**
         * Create a unit quaternion from an axis-angle representation of a rotation
         * @param axis non-zero
         * @param angle in radians
         * @returns a new quaternion
         */
        static FromAxisAngle(axis: Vector3, angle: number): Quaternion;
        /**
         * The x coordinate of the quaternion (imaginary)
         */
        get x(): number;
        /**
         * The y coordinate of the quaternion (imaginary)
         */
        get y(): number;
        /**
         * The z coordinate of the quaternion (imaginary)
         */
        get z(): number;
        /**
         * The w coordinate of the quaternion (real)
         */
        get w(): number;
        /**
         * The length of this quaternion
         * @returns sqrt(x^2 + y^2 + z^2 + w^2)
         */
        length(): number;
        /**
         * Check if this and q have the same coordinates
         * @param q a quaternion
         * @returns true if this and q have the same coordinates
         */
        equals(q: Quaternion): boolean;
        /**
         * Convert to string
         * @returns a string
         */
        toString(): string;
        /**
         * Normalize this quaternion
         * @returns this quaternion, normalized
         * @internal
         */
        _normalize(): Quaternion;
        /**
         * Conjugate this quaternion
         * @returns this quaternion, conjugated
         * @internal
         */
        _conjugate(): Quaternion;
        /**
         * Set the coordinates of this quaternion
         * @param x x-coordinate
         * @param y y-coordinate
         * @param z z-coordinate
         * @param w w-coordinate
         * @returns this quaternion
         * @internal
         */
        _set(x: number, y: number, z: number, w: number): Quaternion;
        /**
         * Copy q to this
         * @param q a quaternion
         * @returns this quaternion
         * @internal
         */
        _copyFrom(q: Quaternion): Quaternion;
        /**
         * Convert a quaternion to a 3x3 rotation matrix
         * @returns a 3x3 rotation matrix
         * @internal
         */
        _toRotationMatrix(): SpeedyMatrix;
        /**
         * Convert a 3x3 rotation matrix to a unit quaternion
         * @param m a 3x3 rotation matrix. You should ensure that it is a rotation matrix
         * @returns this quaternion
         * @internal
         */
        _fromRotationMatrix(m: SpeedyMatrix): Quaternion;
        /**
         * Clone this quaternion
         * @returns a clone of this quaternion
         * @internal
         */
        _clone(): Quaternion;
    }
}
declare module "geometry/pose-filter" {
    import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
    /**
     * Smoothing filter for a pose
     */
    export class PoseFilter {
        /** smooth rotation */
        private _smoothRotation;
        /** smooth translation */
        private _smoothTranslation;
        /** samples of rotations */
        private _rotationSample;
        /** samples of translations */
        private _translationSample;
        /** empty buffers? (i.e., no samples collected?) */
        private _isEmpty;
        /**
         * Constructor
         */
        constructor();
        /**
         * Reset the filter
         */
        reset(): void;
        /**
         * Feed the filter with a sample
         * @param sample 3x4 [ R | t ] matrix
         * @returns true on success
         */
        feed(sample: SpeedyMatrix): boolean;
        /**
         * Run the filter
         * @returns a 3x4 [ R | t ] matrix
         */
        output(): SpeedyMatrix;
    }
}
declare module "geometry/camera-model" {
    import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
    import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    /**
     * Camera model
     */
    export class CameraModel {
        /** size of the image plane */
        private _imageSize;
        /** 3x4 camera matrix */
        private _matrix;
        /** a helper to switch the handedness of a coordinate system */
        private _flipZ;
        /** entries of the intrinsics matrix in column-major format */
        private _intrinsics;
        /** entries of the extrinsics matrix in column-major format */
        private _extrinsics;
        /** smoothing filter */
        private _filter;
        /**
         * Constructor
         */
        constructor();
        /**
         * Initialize the model
         * @param aspectRatio aspect ratio of the image plane
         * @param scale optional scale factor of the image plane
         */
        init(aspectRatio: number, scale?: number): void;
        /**
         * Release the model
         */
        release(): null;
        /**
         * Update the camera model
         * @param homographyNDC 3x3 perspective transform
         * @returns a promise that resolves to a camera matrix
         */
        update(homographyNDC: SpeedyMatrix): SpeedyPromise<SpeedyMatrix>;
        /**
         * Reset the camera model
         */
        reset(): void;
        /**
         * The 3x4 camera matrix
         */
        get matrix(): SpeedyMatrix;
        /**
         * The size of the image plane
         */
        get imageSize(): SpeedySize;
        /**
         * The aspect ratio of the image
         */
        get aspectRatio(): number;
        /**
         * Focal length in "pixels" (projection distance in the pinhole camera model)
         * same as (focal length in mm) * (number of "pixels" per world unit in "pixels"/mm)
         * "pixels" means image plane units
         */
        get focalLength(): number;
        /**
         * Horizontal field-of-view, given in radians
         */
        get fovx(): number;
        /**
         * Vertical field-of-view, given in radians
         */
        get fovy(): number;
        /**
         * Camera intrinsics matrix
         * @returns a 3x3 camera intrinsics matrix
         */
        intrinsicsMatrix(): SpeedyMatrix;
        /**
         * Compute the view matrix. This 4x4 matrix moves 3D points from
         * world space to view space. We want the camera looking in the
         * direction of the negative z-axis (WebGL-friendly)
         * @returns a view matrix
         */
        computeViewMatrix(): SpeedyMatrix;
        /**
         * Compute a perspective projection matrix for WebGL
         * @param near distance of the near plane
         * @param far distance of the far plane
         */
        computeProjectionMatrix(near: number, far: number): SpeedyMatrix;
        /**
         * Reset camera extrinsics
         */
        private _resetExtrinsics;
        /**
         * Reset camera intrinsics
         */
        private _resetIntrinsics;
        /**
         * Convert a homography from NDC to image space
         * @param homographyNDC
         * @returns a new homography
         */
        private _convertToImageSpace;
        /**
         * Compute a normalized homography H^ = K^(-1) * H for an
         * ideal pinhole with f = 1 and principal point = (0,0)
         * @param homography homography H to be normalized
         * @returns normalized homography H^
         */
        private _normalizeHomography;
        /**
         * Estimate [ r1 | r2 | t ], where r1, r2 are orthonormal and t is a translation vector
         * @param normalizedHomography based on the ideal pinhole (where calibration K = I)
         * @returns a 3x3 matrix
         */
        private _estimatePartialPose;
        /**
         * Make two non-zero and non-parallel input vectors, r1 and r2, orthonormal
         * @param rot rotation vectors [ r1 | r2 ] in column-major format
         * @returns a 3x2 matrix R such that R'R = I (column-major format)
         */
        private _refineRotation;
        /**
         * Compute a refined translation vector
         * @param normalizedHomography ideal pinhole K = I
         * @param rot rotation vectors [ r1 | r2 ] in column-major format
         * @param t0 initial estimate for the translation vector
         * @returns 3x1 translation vector in column-major format
         */
        private _refineTranslation;
        /**
         * Find a 3x3 rotation matrix R given two orthonormal vectors [ r1 | r2 ]
         * @param partialRotation partial rotation matrix [ r1 | r2 ] in column-major format
         * @returns a rotation matrix R in column-major format
         */
        private _computeFullRotation;
        /**
         * Estimate the pose [ R | t ] given a homography in sensor space
         * @param homography must be valid
         * @returns 3x4 matrix
         */
        private _estimatePose;
    }
}
declare module "geometry/transform" {
    import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
    import { Vector3 } from "geometry/vector3";
    import { Quaternion } from "geometry/quaternion";
    /**
     * A Transform represents a position, a rotation and a scale in 3D space
     */
    export class Transform {
        /** transformation matrix */
        private readonly _matrix;
        /** inverse transform, computed lazily */
        private _inverse;
        /** position component, computed lazily */
        private _position;
        /** orientation component, computed lazily */
        private _orientation;
        /** scale component, computed lazily */
        private _scale;
        /** whether or not this transformation has been decomposed */
        private _isDecomposed;
        /** whether or not we have extracted the position from the matrix */
        private _isPositionComputed;
        /** unit right vector of the local space, computed lazily */
        private _right;
        /** unit up vector of the local space, computed lazily */
        private _up;
        /** unit forward vector of the local space, computed lazily */
        private _forward;
        /**
         * Constructor
         * @param matrix a 4x4 transformation matrix. You should ensure that its form is T * R * S (translation * rotation * scale).
         */
        constructor(matrix: SpeedyMatrix);
        /**
         * The 4x4 transformation matrix
         * This matrix is not meant to be changed. Changing it will not update the
         * previously computed components of the transform!
         */
        get matrix(): SpeedyMatrix;
        /**
         * The inverse transform
         */
        get inverse(): Transform;
        /**
         * The 3D position encoded by the transform
         */
        get position(): Vector3;
        /**
         * A unit quaternion describing the rotational component of the transform
         */
        get orientation(): Quaternion;
        /**
         * The scale encoded by the transform
         */
        get scale(): Vector3;
        /**
         * Unit right vector of the local space
         */
        get right(): Vector3;
        /**
         * Unit up vector of the local space
         */
        get up(): Vector3;
        /**
         * Unit forward vector of the local space
         */
        get forward(): Vector3;
        /**
         * Use this transform to scale and rotate a vector
         * The translation component of the transform is ignored
         * @param v a vector
         * @returns input vector v
         */
        private _scaleAndRotate;
        /**
         * Decompose this transform
         */
        private _decompose;
        /**
         * A simpler decomposition routine.
         * Sometimes we just need the position.
         */
        private _computePosition;
        /**
         * Compute the inverse matrix of this transform
         * @returns the inverse matrix
         */
        private _inverseMatrix;
    }
}
declare module "geometry/pose" {
    import { Transform } from "geometry/transform";
    /**
     * A pose represents a position and an orientation in 3D space
     */
    export class Pose {
        /** Internal transform */
        private _transform;
        /**
         * Constructor
         * @param transform usually a rigid transform in a 3D space (e.g., world space, viewer space or other)
         */
        constructor(transform: Transform);
        /**
         * A transform describing the position and the orientation
         * of the pose relative to the 3D space to which it belongs
         */
        get transform(): Transform;
    }
}
declare module "geometry/viewer-pose" {
    import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
    import { Pose } from "geometry/pose";
    import { CameraModel } from "geometry/camera-model";
    /**
     * The pose of a virtual camera in 3D world space at a moment in time
     */
    export class ViewerPose extends Pose {
        /** The view matrix */
        private readonly _viewMatrix;
        /**
         * Constructor
         * @param camera camera model
         */
        constructor(camera: CameraModel);
        /**
         * This 4x4 matrix moves 3D points from world space to view space.
         * We assume that the camera is looking in the direction of the
         * negative z-axis (WebGL-friendly)
         */
        get viewMatrix(): SpeedyMatrix;
    }
}
declare module "geometry/view" {
    import { SpeedyMatrix } from 'speedy-vision/types/core/speedy-matrix';
    import { CameraModel } from "geometry/camera-model";
    /**
     * A view of the 3D world at a moment in time,
     * featuring the means to project points into clip space
     */
    export interface View {
        /** A 4x4 matrix that projects the viewer space into the clip space, i.e., [-1,1]^3 */
        readonly projectionMatrix: SpeedyMatrix;
        /** @internal The inverse of the projection matrix */
        readonly _projectionMatrixInverse: SpeedyMatrix;
    }
    /**
     * A PerspectiveView is a View defining a symmetric frustum around the z-axis
     * (perspective projection)
     */
    export class PerspectiveView implements View {
        /** Camera model */
        private readonly _camera;
        /** Distance of the near plane to the optical center of the camera */
        private readonly _near;
        /** Distance of the far plane to the optical center of the camera*/
        private readonly _far;
        /** A 4x4 matrix that projects viewer space into clip space, i.e., [-1,1]^3 */
        private readonly _projectionMatrix;
        /** The inverse of the projection matrix, computed lazily */
        private _inverseProjection;
        /**
         * Constructor
         * @param camera camera model
         * @param near distance of the near plane
         * @param far distance of the far plane
         */
        constructor(camera: CameraModel, near?: number, far?: number);
        /**
         * A 4x4 projection matrix for WebGL
         */
        get projectionMatrix(): SpeedyMatrix;
        /**
         * The inverse of the projection matrix
         * @internal
         */
        get _projectionMatrixInverse(): SpeedyMatrix;
        /**
         * Aspect ratio of the frustum
         */
        get aspect(): number;
        /**
         * Horizontal field-of-view of the frustum, measured in radians
         */
        get fovx(): number;
        /**
         * Vertical field-of-view of the frustum, measured in radians
         */
        get fovy(): number;
        /**
         * Distance of the near plane
         */
        get near(): number;
        /**
         * Distance of the far plane
         */
        get far(): number;
    }
}
declare module "geometry/vector2" {
    /**
     * A vector in 2D space
     */
    export class Vector2 {
        /** x coordinate */
        private _x;
        /** y coordinate */
        private _y;
        /**
         * Constructor
         */
        constructor(x?: number, y?: number);
        /**
         * Instantiate a zero vector
         * @returns a new zero vector
         */
        static Zero(): Vector2;
        /**
         * Immutable zero vector
         * @returns an immutable zero vector
         */
        static get ZERO(): Vector2;
        /**
         * The x coordinate of the vector
         */
        get x(): number;
        /**
         * The y coordinate of the vector
         */
        get y(): number;
        /**
         * The length of this vector
         * @returns sqrt(x^2 + y^2)
         */
        length(): number;
        /**
         * Compute the dot product of this and v
         * @param v a vector
         * @returns the dot product of the vectors
         */
        dot(v: Vector2): number;
        /**
         * Compute the distance between points this and v
         * @param v a vector / point
         * @returns the distance between the points
         */
        distanceTo(v: Vector2): number;
        /**
         * Compute the direction from this to v
         * @param v a vector
         * @returns a new unit vector pointing to v from this
         */
        directionTo(v: Vector2): Vector2;
        /**
         * Compute a unit vector with the same direction as this
         * @returns a new unit vector with the same direction as this
         */
        normalized(): Vector2;
        /**
         * Compute the sum between this vector and v
         * @param v a vector
         * @returns a new vector equal to the sum between this and v
         */
        plus(v: Vector2): Vector2;
        /**
         * Compute the difference between this vector and v
         * @param v a vector
         * @returns a new vector equal to the difference this - v
         */
        minus(v: Vector2): Vector2;
        /**
         * Compute the multiplication between this vector and a scale factor
         * @param scale scalar quantity
         * @returns a new vector equal to the multiplication between this and the scale factor
         */
        times(scale: number): Vector2;
        /**
         * Check if this and v have the same coordinates
         * @param v a vector
         * @returns true if this and v have the same coordinates
         */
        equals(v: Vector2): boolean;
        /**
         * Convert to string
         * @returns a string
         */
        toString(): string;
        /**
         * Set the coordinates of this vector
         * @param x x-coordinate
         * @param y y-coordinate
         * @returns this vector
         * @internal
         */
        _set(x: number, y: number): Vector2;
        /**
         * Copy v to this vector
         * @param v a vector
         * @returns this vector
         * @internal
         */
        _copyFrom(v: Vector2): Vector2;
        /**
         * Normalize this vector
         * @returns this vector, normalized
         * @internal
         */
        _normalize(): Vector2;
        /**
         * Add v to this vector
         * @param v a vector
         * @returns this vector
         * @internal
         */
        _add(v: Vector2): Vector2;
        /**
         * Subtract v from this vector
         * @param v a vector
         * @returns this vector
         * @internal
         */
        _subtract(v: Vector2): Vector2;
        /**
         * Scale this vector by a scalar
         * @param s scalar
         * @returns this vector
         * @internal
         */
        _scale(s: number): Vector2;
        /**
         * Clone this vector
         * @returns a clone of this vector
         * @internal
         */
        _clone(): Vector2;
    }
}
declare module "geometry/ray" {
    import { Vector3 } from "geometry/vector3";
    /**
     * A ray with origin and direction
     */
    export class Ray {
        /** origin of the ray, a point */
        private _origin;
        /** direction, a unit vector */
        private _direction;
        /**
         * Constructor
         * @param origin a point
         * @param direction a unit vector
         */
        constructor(origin: Vector3, direction: Vector3);
        /**
         * The origin point of the ray
         */
        get origin(): Vector3;
        /**
         * The direction of the ray, a unit vector
         */
        get direction(): Vector3;
    }
}
declare module "geometry/viewer" {
    import { CameraModel } from "geometry/camera-model";
    import { Pose } from "geometry/pose";
    import { ViewerPose } from "geometry/viewer-pose";
    import { View } from "geometry/view";
    import { Vector2 } from "geometry/vector2";
    import { Ray } from "geometry/ray";
    /**
     * A viewer represents a virtual camera in 3D world space
     */
    export class Viewer {
        /** the pose of the viewer in 3D world space */
        private readonly _pose;
        /** the views of this viewer (1 for monoscopic rendering; 2 for stereoscopic) */
        private readonly _views;
        /**
         * Constructor
         * @param camera camera model
         */
        constructor(camera: CameraModel);
        /**
         * The pose of this viewer
         */
        get pose(): ViewerPose;
        /**
         * The view of this viewer (only for monoscopic rendering)
         */
        get view(): View;
        /**
         * The views of this viewer
         */
        /**
         * Convert a pose from world space to viewer space
         * @param pose a pose in world space
         * @returns a pose in viewer space
         */
        convertToViewerSpace(pose: Pose): Pose;
        /**
         * Cast a ray from a point in the image space associated with this Viewer
         * @param position a point in image space, given in normalized units [-1,1]x[-1,1]
         * @returns a ray in world space that corresponds to the given point
         */
        raycast(position: Vector2): Ray;
        /**
         * Compute a ray in the forward direction from the viewer
         * @returns a new ray in world space
         */
        forwardRay(): Ray;
    }
}
declare module "trackers/image-tracker/states/tracking" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { SpeedyPipeline, SpeedyPipelineOutput } from 'speedy-vision/types/core/pipeline/pipeline';
    import { ImageTracker } from "trackers/image-tracker/image-tracker";
    import { ImageTrackerState, ImageTrackerStateOutput } from "trackers/image-tracker/states/state";
    /**
     * The tracking state of the Image Tracker tracks
     * keypoints of the image target and updates the
     * rectification matrix
     */
    export class ImageTrackerTrackingState extends ImageTrackerState {
        /** tracked image */
        private _referenceImage;
        /** current homography (for warping) */
        private _warpHomography;
        /** current homography (for computing the pose) */
        private _poseHomography;
        private _prevHomography;
        /** initial keypoints (i.e., the keypoints we found when we first started tracking) */
        private _templateKeypoints;
        /** the screen size when the tracking began */
        private _initialScreenSize;
        /** last output of the tracker */
        private _lastOutput;
        /** last output of the pipeline */
        private _lastPipelineOutput;
        /** a helper for frame skipping */
        private _skipCounter;
        /** a helper */
        private _counter;
        /** the number of consecutive frames in which we have lost the tracking */
        private _lostCounter;
        /** camera model linked to the tracked image */
        private _camera;
        /** a camera model that is fixed at the origin */
        private _fixedCamera;
        /**
         * Constructor
         * @param imageTracker
         */
        constructor(imageTracker: ImageTracker);
        /**
         * Called as soon as this becomes the active state, just before update() runs for the first time
         * @param settings
         */
        onEnterState(settings: Record<string, any>): void;
        /**
         * Called when leaving the state
         */
        onLeaveState(): void;
        /**
         * Called just before the GPU processing
         * @returns promise
         */
        protected _beforeUpdate(): SpeedyPromise<void>;
        /**
         * GPU processing
         * @returns promise with the pipeline results
         */
        protected _gpuUpdate(): SpeedyPromise<SpeedyPipelineOutput>;
        /**
         * Post processing that takes place just after the GPU processing
         * @param result pipeline results
         * @returns state output
         */
        protected _afterUpdate(result: SpeedyPipelineOutput): SpeedyPromise<ImageTrackerStateOutput>;
        /**
         * Find an affine motion model in NDC between pairs of keypoints in NDC
         * given as a 2 x 2n [ src | dest ] matrix
         * @param points compiled pairs of keypoints in NDC
         * @returns a promise that resolves to a 3x3 warp in NDC that maps source to destination
         */
        private _findAffineMotionNDC;
        /**
         * Find a perspective motion model in NDC between pairs of keypoints in NDC
         * given as a 2 x 2n [ src | dest ] matrix
         * @param points compiled pairs of keypoints in NDC
         * @returns a promise that resolves to a 3x3 warp in NDC that maps source to destination
         */
        private _findPerspectiveMotionNDC;
        /**
         * Find a 6 DoF perspective motion model in NDC between pairs of keypoints in NDC
         * given as a 2 x 2n [ src | dest ] matrix
         * @param points compiled pairs of keypoints in NDC
         * @returns a promise that resolves to a 3x3 warp in NDC that maps source to destination
         */
        private _find6DoFPerspectiveMotionNDC;
        /**
         * Find matching pairs of two sets of keypoints matched via brute force
         * @param srcKeypoints source (database)
         * @param destKeypoints destination
         * @returns an array of matching pairs [src, dest]
         */
        private _findMatchingPairs;
        /**
         * Predict the keypoints without actually looking at the image
         * @param curr keypoints at time t (will modify the contents)
         * @param prev keypoints at time t-1 (not just t = 0)
         * @returns keypoints at time t+1
         */
        /**
         * Create & setup the pipeline
         * @returns pipeline
         */
        protected _createPipeline(): SpeedyPipeline;
    }
}
declare module "trackers/image-tracker/image-tracker" {
    import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { SpeedyKeypoint } from 'speedy-vision/types/core/speedy-keypoint';
    import { Tracker, TrackerOutput, TrackerResult, Trackable, TrackerType } from "trackers/tracker";
    import { Session } from "core/session";
    import { Resolution } from "utils/resolution";
    import { ReferenceImage, ReferenceImageWithMedia } from "trackers/image-tracker/reference-image";
    import { ReferenceImageDatabase } from "trackers/image-tracker/reference-image-database";
    import { Nullable } from "utils/utils";
    import { AREventTarget } from "utils/ar-events";
    import { ImageTrackerEvent } from "trackers/image-tracker/image-tracker-event";
    import { SpeedyPoint2 } from 'speedy-vision/types/core/speedy-point';
    import { Viewer } from "geometry/viewer";
    import { Pose } from "geometry/pose";
    import { CameraModel } from "geometry/camera-model";
    /** A trackable target */
    export interface TrackableImage extends Trackable {
        /** the pose of the target */
        readonly pose: Pose;
        /** the reference image linked to the target */
        readonly referenceImage: ReferenceImage;
    }
    /** Image Tracker result to be consumed by the user */
    export class ImageTrackerResult extends TrackerResult {
        /** tracker */
        readonly tracker: ImageTracker;
        /** trackable targets */
        readonly trackables: TrackableImage[];
        /** 3D virtual camera */
        readonly viewer: Viewer;
        /**
         * Constructor
         * @param tracker
         * @param trackables
         * @param viewer
         */
        constructor(tracker: ImageTracker, trackables: TrackableImage[], viewer: Viewer);
    }
    /** Image Tracker output */
    export interface ImageTrackerOutput extends TrackerOutput {
        /** tracker result to be consumed by the user */
        readonly exports?: ImageTrackerResult;
        /** keypoints found in this framestep */
        readonly keypoints?: SpeedyKeypoint[];
        /** optional keypoints for visualizing & testing */
        readonly keypointsNIS?: SpeedyKeypoint[];
        /** optional polyline for visualizing & testing */
        readonly polylineNDC?: SpeedyPoint2[];
        /** optional camera model for visualizing & testing */
        readonly camera?: CameraModel;
    }
    /** All possible states of an Image Tracker */
    export type ImageTrackerStateName = 'initial' | 'training' | 'scanning' | 'pre-tracking-a' | 'pre-tracking-b' | 'tracking';
    /** Options for instantiating an ImageTracker */
    export interface ImageTrackerOptions {
        /** resolution of the tracker; it helps define the AR screen space */
        resolution?: Resolution;
    }
    /**
     * The ImageTracker tracks an image (one at a time)
     */
    export class ImageTracker extends AREventTarget<ImageTrackerEvent> implements Tracker {
        /** session */
        private _session;
        /** source of data */
        private _source;
        /** all states */
        private readonly _state;
        /** name of the active state */
        private _activeStateName;
        /** last emitted output of the tracker */
        private _lastOutput;
        /** reference image database */
        private readonly _database;
        /** the AR resolution size, used in GPU processing, defines the AR screen space */
        private _resolution;
        /**
         * Constructor
         * @param options
         */
        constructor(options: ImageTrackerOptions);
        /**
         * The type of the tracker
         * @deprecated use is() instead
         */
        get type(): keyof TrackerType;
        /**
         * Check if this tracker is of a certain type
         */
        is<T extends keyof TrackerType>(type: T): this is TrackerType[T];
        /**
         * Current state name
         */
        get state(): ImageTrackerStateName;
        /**
         * Reference Image Database
         * Must be configured before training the tracker
         */
        get database(): ReferenceImageDatabase;
        /**
         * Resolution of the tracker
         */
        get resolution(): Resolution;
        /**
         * Resolution of the tracker
         * @readonly
         */
        set resolution(resolution: Resolution);
        /**
         * Size of the AR screen space, in pixels
         * @internal
         */
        get screenSize(): SpeedySize;
        /**
         * Last emitted output
         * @internal
         */
        get _output(): ImageTrackerOutput;
        /**
         * Stats related to this tracker
         * @internal
         */
        get _stats(): string;
        /**
         * Initialize this tracker
         * @param session
         * @returns promise that resolves after the tracker has been initialized
         * @internal
         */
        _init(session: Session): SpeedyPromise<void>;
        /**
         * Release this tracker
         * @returns promise that resolves after the tracker has been released
         * @internal
         */
        _release(): SpeedyPromise<void>;
        /**
         * Update the tracker
         * @returns promise
         * @internal
         */
        _update(): SpeedyPromise<void>;
        /**
         * Get reference image
         * @param keypointIndex -1 if not found
         * @returns reference image
         * @internal
         */
        _referenceImageOfKeypoint(keypointIndex: number): Nullable<ReferenceImageWithMedia>;
        /**
         * Get reference image index
         * @param keypointIndex -1 if not found
         * @returns reference image index, or -1 if not found
         * @internal
         */
        _referenceImageIndexOfKeypoint(keypointIndex: number): number;
        /**
         * Get a keypoint of the trained set
         * @param keypointIndex
         * @returns a keypoint
         * @internal
         */
        _referenceKeypoint(keypointIndex: number): Nullable<SpeedyKeypoint>;
        /**
         * Compute the current size of the AR screen space
         * Note that this may change over time
         * @returns size
         */
        private _computeScreenSize;
    }
}
declare module "trackers/pointer-tracker/trackable-pointer" {
    import { Trackable } from "trackers/tracker";
    import { Vector2 } from "geometry/vector2";
    /**
     * The phase of a TrackablePointer. Possible values:
     * - "began": the tracking began in this frame (e.g., a finger has just touched the screen)
     * - "stationary": the user did not move the pointer in this frame
     * - "moved": the user moved the pointer in this frame
     * - "ended": the tracking ended in this frame (e.g., a finger has just been lifted from the screen)
     * - "canceled": the tracking was canceled in this frame (e.g., the page has just lost focus)
     */
    export type TrackablePointerPhase = 'began' | 'moved' | 'stationary' | 'ended' | 'canceled';
    /**
     * A trackable representing an instance of pointer-based input
     */
    export interface TrackablePointer extends Trackable {
        /** a unique identifier assigned to this pointer */
        readonly id: number;
        /** the phase of the pointer */
        readonly phase: TrackablePointerPhase;
        /** current position, given in space units */
        readonly position: Vector2;
        /** the difference between the position of the pointer in this and in the previous frame */
        readonly deltaPosition: Vector2;
        /** the position of the pointer when its tracking began */
        readonly initialPosition: Vector2;
        /** current velocity, given in space units per second */
        readonly velocity: Vector2;
        /** elapsed time, in seconds, since the tracking of this pointer began */
        readonly duration: number;
        /** the total time, in seconds, in which this pointer has moved */
        readonly movementDuration: number;
        /** how much this pointer has moved, in space units, since its tracking began */
        readonly movementLength: number;
        /** whether or not this is the primary pointer for this type */
        readonly isPrimary: boolean;
        /** the type of the originating device; typically "mouse", "touch" or "pen" */
        readonly kind: string;
    }
}
declare module "trackers/pointer-tracker/pointer-tracker" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { TrackerResult, TrackerOutput, Tracker, TrackerType } from "trackers/tracker";
    import { TrackablePointer } from "trackers/pointer-tracker/trackable-pointer";
    import { Session } from "core/session";
    /**
     * A result of a PointerTracker. It's meant to be consumed by the user/application
     */
    export class PointerTrackerResult extends TrackerResult {
        /** the tracker that generated this result */
        readonly tracker: PointerTracker;
        /** the trackables */
        readonly trackables: TrackablePointer[];
        /**
         * Constructor
         * @param tracker
         * @param trackables
         */
        constructor(tracker: PointerTracker, trackables: TrackablePointer[]);
    }
    /**
     * The output of a PointerTracker in a particular Frame of a Session
     */
    export interface PointerTrackerOutput extends TrackerOutput {
        /** tracker result to be consumed by the user */
        readonly exports: PointerTrackerResult;
    }
    /**
     * The space in which pointers are located.
     *
     * - In "normalized" space, pointers are located in [-1,1]x[-1,1]. The origin
     *   of the space is at the center of the viewport. The x-axis points to the
     *   right and the y-axis points up. This is the default space.
     *
     *   - Point (0,0) is at the center of the viewport
     *   - The top-right corner of the viewport is at (+1,+1)
     *   - The bottom-left corner of the viewport is at (-1,-1)
     *
     * - The "adjusted" space is similar to the normalized space, except that it is
     *   scaled so that it matches the aspect ratio of the viewport.
     *
     *   Pointers in adjusted space are contained in normalized space, but unless
     *   the viewport is a square, one of their coordinates, x or y, will no longer
     *   range from -1 to +1. It will range from -s to +s, where s = min(a, 1/a).
     *   In this expression, a is the aspect ratio of the viewport and s is less
     *   than or equal to 1.
     *
     *   Selecting the adjusted space is useful for making sure that pointer speeds
     *   are equivalent in both axes and for preserving movement curves. Speeds are
     *   not equivalent and movement curves are not preserved by default because
     *   the normalized space is a square, whereas the viewport is a rectangle.
     *
     *   In summary, prefer the adjusted space when working with velocities and
     *   movement curves.
     */
    export type PointerSpace = 'normalized' | 'adjusted';
    /**
     * Options for instantiating a PointerTracker
     */
    export interface PointerTrackerOptions {
        /** the space in which pointers will be located */
        space?: PointerSpace;
    }
    /**
     * A tracker of pointer-based input such as mouse, touch or pen
     */
    export class PointerTracker implements Tracker {
        /** the source of data */
        private _source;
        /** the viewport */
        private _viewport;
        /** pointer space */
        private _space;
        /** active pointers */
        private _activePointers;
        /** new pointers */
        private _newPointers;
        /** helper map for normalizing IDs */
        private _idMap;
        /** previous output */
        private _previousOutput;
        /** time of the previous update */
        private _previousUpdateTime;
        /** helper flag */
        private _wantToReset;
        /** auto-increment ID */
        private _nextId;
        /**
         * Constructor
         * @param options
         */
        constructor(options: PointerTrackerOptions);
        /**
         * Build a full and validated options object
         * @param options
         * @returns validated options with defaults
         */
        private _buildSettings;
        /**
         * The type of the tracker
         * @deprecated use is() instead
         */
        get type(): keyof TrackerType;
        /**
         * Check if this tracker is of a certain type
         */
        is<T extends keyof TrackerType>(type: T): this is TrackerType[T];
        /**
         * Initialize the tracker
         * @param session
         * @returns a promise that is resolved as soon as the tracker is initialized
         * @internal
         */
        _init(session: Session): SpeedyPromise<void>;
        /**
         * Release the tracker
         * @returns a promise that is resolved as soon as the tracker is released
         * @internal
         */
        _release(): SpeedyPromise<void>;
        /**
         * Update the tracker (update cycle)
         * @returns a promise that is resolved as soon as the tracker is updated
         * @internal
         */
        _update(): SpeedyPromise<void>;
        /**
         * Output of the previous frame
         * @internal
         */
        get _output(): PointerTrackerOutput;
        /**
         * Stats info
         * @internal
         */
        get _stats(): string;
        /**
         * The space in which pointers are located.
         * You may set it when instantiating the tracker.
         */
        get space(): PointerSpace;
        /**
         * Generate tracker output
         * @returns a new PointerTrackerOutput object
         */
        private _generateOutput;
        /**
         * Update all active pointers
         * @param fields
         */
        private _updateAllTrackables;
        /**
         * Advance the elapsed time of all stationary pointers
         * @param deltaTime
         */
        private _advanceAllStationaryTrackables;
        /**
         * Normalize pointer IDs across browsers
         * @param pointerId browser-provided pointer ID
         * @param pointerType pointer type
         * @returns a normalized pointer ID
         */
        private _normalizeId;
        /**
         * Cancel all active pointers and consume all events
         * @param deltaTime
         */
        private _reset;
        /**
         * Reset in the next update of the tracker
         */
        private _resetInTheNextUpdate;
        /**
         * As a convenience, let's make sure that a primary pointer, if any exists,
         * is at the beginning of the trackables array
         * @param trackables
         * @returns sorted trackables
         */
        private _sortTrackables;
        /**
         * Find trackables to remove
         * @returns a list of trackables to remove
         */
        private _findInactiveTrackables;
        /**
         * Update the time
         * @returns delta time in seconds
         */
        private _updateTime;
    }
}
declare module "trackers/tracker" {
    import { Session } from "core/session";
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { SpeedyMedia } from 'speedy-vision/types/core/speedy-media';
    import { ImageTracker, ImageTrackerResult } from "trackers/image-tracker/image-tracker";
    import { PointerTracker, PointerTrackerResult } from "trackers/pointer-tracker/pointer-tracker";
    /**
     * A Trackable is something that can be tracked
     */
    export interface Trackable {
        /** the tracker that generated this trackable */
        readonly tracker: Tracker;
    }
    /**
     * The result of a Tracker in a particular frame of a session. Such result is
     * meant to be consumed by the user/application.
     */
    export abstract class TrackerResult {
        /** the tracker that generated this result */
        abstract readonly tracker: Tracker;
        /** an array of trackables (possibly empty) */
        abstract readonly trackables: Trackable[];
        /** check if this result was generated by a tracker of a certain type */
        of<T extends keyof TrackerResultType>(trackerType: T): this is TrackerResultType[T];
    }
    /**
     * The output generated by a Tracker in a particular Frame of a Session
     */
    export interface TrackerOutput {
        /** tracker result to be consumed by the user */
        readonly exports?: TrackerResult;
        /** optional image for testing */
        readonly image?: SpeedyMedia;
    }
    /**
     * A Tracker is an AR subsystem attached to a Session
     */
    export interface Tracker {
        /** check if this tracker is of a certain type */
        is<T extends keyof TrackerType>(type: T): this is TrackerType[T];
        /** initialize tracker @internal */
        _init(session: Session): SpeedyPromise<void>;
        /** release resources @internal */
        _release(): SpeedyPromise<void>;
        /** update cycle @internal */
        _update(): SpeedyPromise<void>;
        /** output of the last frame @internal */
        readonly _output: TrackerOutput;
        /** stats related to this tracker @internal */
        readonly _stats: string;
        /** a string that identifies the type of the tracker
         *  @deprecated use is() instead */
        readonly type: keyof TrackerType;
    }
    /**
     * A helper for type-narrowing
     * @internal
     */
    export type TrackerType = {
        'image-tracker': ImageTracker;
        'pointer-tracker': PointerTracker;
    };
    /**
     * A helper for type-narrowing
     * @internal
     */
    export type TrackerResultType = {
        'image-tracker': ImageTrackerResult;
        'pointer-tracker': PointerTrackerResult;
    };
}
declare module "ui/stats-panel" {
    import { Viewport } from "core/viewport";
    import { Tracker } from "trackers/tracker";
    import { Source } from "sources/source";
    /**
     * Stats panel used for development purposes
     */
    export class StatsPanel {
        /** A container for the panel */
        private readonly _container;
        /** Time of last update, in milliseconds */
        private _lastUpdate;
        /**
         * Constructor
         */
        constructor();
        /**
         * Initialize the panel
         * @param parent parent node
         * @param isVisible
         */
        init(parent: Node, isVisible: boolean): void;
        /**
         * Release the panel
         */
        release(): void;
        /**
         * A method to be called in the update loop
         * @param time current time in ms
         * @param sources the sources of media linked to the session
         * @param trackers the trackers attached to the session
         * @param viewport the viewport
         * @param gpu GPU cycles per second
         * @param fps frames per second
         */
        update(time: DOMHighResTimeStamp, sources: Source[], trackers: Tracker[], viewport: Viewport, gpu: number, fps: number): void;
        /**
         * Update the contents of the panel
         * @param sources the sources of media linked to the session
         * @param trackers the trackers attached to the session
         * @param viewport the viewport
         * @param fps frames per second
         * @param gpu GPU cycles per second
         */
        private _update;
        /**
         * Get a label of the panel
         * @param className
         * @returns the HTML element, or null if it doesn't exist
         */
        private _label;
        /**
         * Associate a color to a frequency number
         * @param f frequency given in cycles per second
         * @returns colorized number (HTML)
         */
        private _color;
        /**
         * Create the container for the panel
         * @returns a container
         */
        private _createContainer;
        /**
         * Create a title
         * @returns a title
         */
        private _createTitle;
        /**
         * Create a content container
         * @returns a content container
         */
        private _createContent;
    }
}
declare module "ui/fullscreen-button" {
    import { Viewport } from "core/viewport";
    /**
     * Built-in fullscreen button
     */
    export class FullscreenButton {
        /** The viewport associated to this panel */
        private readonly _viewport;
        /** The HTML element of the button */
        private readonly _button;
        /**
         * Constructor
         * @param viewport Viewport
         */
        constructor(viewport: Viewport);
        /**
         * Initialize
         * @param parent parent node
         * @param isVisible
         */
        init(parent: Node, isVisible: boolean): void;
        /**
         * Release
         */
        release(): void;
        /**
         * Create the <button> element
         */
        private _createButton;
        /**
         * Handle a fullscreenchange event
         */
        private _handleFullscreenEvent;
    }
}
declare module "ui/reminder-dialog" {
    /**
     * Reminder dialog
     */
    export class ReminderDialog {
        /** A dialog element */
        private readonly _dialog;
        /**
         * Constructor
         */
        constructor();
        /**
         * Initialize
         * @param parent parent node
         */
        init(parent: Node): void;
        /**
         * Release
         */
        release(): void;
        /**
         * Show the reminder
         * @returns true on success
         */
        private _show;
        /**
         * Close the reminder
         * @returns true on success
         */
        private _close;
        /**
         * Whether or not the reminder should be displayed at this time
         * @returns a boolean
         */
        private _isEnabled;
        /**
         * Create the dialog element
         * @returns the dialog element
         */
        private _createDialog;
    }
}
declare module "core/hud" {
    import { Viewport } from "core/viewport";
    import { StatsPanel } from "ui/stats-panel";
    import { Nullable } from "utils/utils";
    /** HUD container */
    export type HUDContainer = HTMLDivElement;
    /**
     * Heads Up Display: an overlay displayed in front of the augmented scene
     */
    export class HUD {
        #private;
        /** Container */
        private _container;
        /** Whether or not we have created our own container */
        private _isOwnContainer;
        /** Container for the internal components */
        private _internalContainer;
        /**
         * Constructor
         * @param viewport viewport
         * @param parent parent of the hud container
         * @param hudContainer an existing hud container (optional)
         */
        constructor(viewport: Viewport, parent: HTMLElement, hudContainer?: Nullable<HUDContainer>);
        /**
         * The container of the HUD
         */
        get container(): HUDContainer;
        /**
         * Whether or not the HUD is visible
         * @deprecated what's the purpose of this being public?
         */
        get visible(): boolean;
        /**
         * Whether or not the HUD is visible
         * @deprecated what's the purpose of this being public?
         */
        set visible(visible: boolean);
        /**
         * Stats panel
         * @internal
         */
        get _statsPanel(): StatsPanel;
        /**
         * Initialize the HUD
         * @param zIndex the z-index of the container
         * @param wantStatsPanel
         * @param wantFullscreenButton
         * @internal
         */
        _init(zIndex: number, wantStatsPanel: boolean, wantFullscreenButton: boolean): void;
        /**
         * Release the HUD
         * @internal
         */
        _release(): void;
        /**
         * Create a HUD container as an immediate child of the input node
         * @param parent parent container
         * @returns HUD container
         */
        private _createContainer;
        /**
         * Whether or not the HUD is visible
         */
        private get _visible();
        /**
         * Whether or not the HUD is visible
         */
        private set _visible(value);
    }
}
declare module "core/viewport" {
    import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { SessionMode } from "core/session";
    import { HUD, HUDContainer } from "core/hud";
    import { Vector2 } from "geometry/vector2";
    import { Resolution } from "utils/resolution";
    import { Nullable } from "utils/utils";
    import { AREvent, AREventTarget } from "utils/ar-events";
    /** Viewport container */
    export type ViewportContainer = HTMLDivElement;
    /** We admit that the size of the drawing buffer of the background canvas of the viewport may change over time */
    type ViewportSizeGetter = () => SpeedySize;
    /** All possible event types emitted by a Viewport */
    type ViewportEventType = 'resize' | 'fullscreenchange';
    /** An event emitted by a Viewport */
    export class ViewportEvent extends AREvent<ViewportEventType> {
    }
    /** Viewport style (immersive mode) */
    export type ViewportStyle = 'best-fit' | 'stretch' | 'crop' | 'inline';
    /**
     * Viewport constructor settings
     */
    export interface ViewportSettings {
        /** Viewport container */
        container: Nullable<ViewportContainer>;
        /** HUD container */
        hudContainer?: Nullable<HUDContainer>;
        /** Resolution of the canvas on which the virtual scene will be drawn */
        resolution?: Resolution;
        /** Viewport style */
        style?: ViewportStyle;
        /** An existing <canvas> on which the virtual scene will be drawn */
        canvas?: Nullable<HTMLCanvasElement>;
        /** Whether or not to include the built-in fullscreen button */
        fullscreenUI?: boolean;
    }
    /**
     * Utility for taking snapshots of the AR scene
     */
    export class ViewportSnapshotter {
        /** reference to the viewport */
        private readonly _viewport;
        /** lazily instantiated canvas */
        private _canvas;
        /**
         * Constructor
         */
        constructor(viewport: Viewport);
        /**
         * Take a snapshot of the AR scene
         * @param resolution optional resolution type. If unspecified, the resolution of the viewport will be used
         * @returns a promise to an ImageBitmap. Tip: for efficient usage, transfer the bitmap or close it when you're done
         */
        takeSnapshot(resolution?: Resolution): SpeedyPromise<ImageBitmap>;
        /**
         * Create a canvas with the specified size
         * @param width in pixels
         * @param height in pixels
         * @returns a new canvas (or offscreen canvas if it's supported)
         */
        private _createCanvas;
    }
    /**
     * Viewport
     */
    export class Viewport extends AREventTarget<ViewportEvent> {
        /** Viewport resolution (controls the size of the drawing buffer of the foreground canvas) */
        private readonly _resolution;
        /** Viewport settings */
        private readonly _settings;
        /** The containers */
        private readonly _containers;
        /** An overlay displayed in front of the augmented scene */
        private readonly _hud;
        /** Viewport style */
        private _style;
        /** The canvases of the viewport */
        private readonly _canvases;
        /** Resize helper */
        private readonly _resizer;
        /** The current size of the underlying SpeedyMedia */
        private _mediaSize;
        /** Fullscreen utilities */
        private readonly _fullscreen;
        /** Snapshotter */
        private readonly _snapshotter;
        /**
         * Constructor
         * @param viewportSettings
         */
        constructor(viewportSettings: ViewportSettings);
        /**
         * Viewport container
         */
        get container(): ViewportContainer;
        /**
         * Viewport style
         */
        get style(): ViewportStyle;
        /**
         * HUD
         */
        get hud(): HUD;
        /**
         * Resolution of the virtual scene
         */
        get resolution(): Resolution;
        /**
         * Size in pixels of the drawing buffer of the canvas
         * on which the virtual scene will be drawn
         */
        get virtualSize(): SpeedySize;
        /**
         * Aspect ratio of the viewport
         */
        get aspectRatio(): number;
        /**
         * Is the viewport currently being displayed in fullscreen mode?
         */
        get fullscreen(): boolean;
        /**
         * Is the fullscreen mode available in this platform?
         */
        get fullscreenAvailable(): boolean;
        /**
         * The canvas on which the virtual scene will be drawn
         */
        get canvas(): HTMLCanvasElement;
        /**
         * The canvas on which the physical scene will be drawn
         * @internal
         */
        get _backgroundCanvas(): HTMLCanvasElement;
        /**
         * Size of the drawing buffer of the background canvas, in pixels
         * @internal
         */
        get _realSize(): SpeedySize;
        /**
         * Sub-container of the viewport container
         * @internal
         */
        get _subContainer(): HTMLDivElement;
        /**
         * Request fullscreen mode
         * @returns promise
         */
        requestFullscreen(): SpeedyPromise<void>;
        /**
         * Exit fullscreen mode
         * @returns promise
         */
        exitFullscreen(): SpeedyPromise<void>;
        /**
         * Convert a position given in space units to a corresponding pixel
         * position in canvas space. Units in normalized space range from -1 to +1.
         * The center of the canvas is at (0,0). The top right corner is at (1,1).
         * The bottom left corner is at (-1,-1).
         * @param position in space units
         * @param space either "normalized" (default) or "adjusted"; @see PointerSpace
         * @returns an equivalent pixel position in canvas space
         */
        convertToPixels(position: Vector2, space?: "normalized" | "adjusted"): Vector2;
        /**
         * Convert a pixel position given in canvas space to a corresponding
         * position in space units. This is the inverse of convertToPixels().
         * @param position in canvas space
         * @space either "normalized" (default) or "adjusted"; see @PointerSpace
         * @returns an equivalent position in space units
         */
        convertFromPixels(position: Vector2, space?: "normalized" | "adjusted"): Vector2;
        /**
         * Take a snapshot of the AR scene
         * @param resolution optional resolution type. If unspecified, the resolution of the viewport will be used
         * @returns a promise to an ImageBitmap. Tip: for efficient usage, transfer the bitmap or close it when you're done
         */
        takeSnapshot(resolution?: Resolution): SpeedyPromise<ImageBitmap>;
        /**
         * Initialize the viewport (when the session starts)
         * @param getMediaSize
         * @param sessionMode
         * @param wantStatsPanel
         * @internal
         */
        _init(getMediaSize: ViewportSizeGetter, sessionMode: SessionMode, wantStatsPanel: boolean): void;
        /**
         * Release the viewport (when the session ends)
         * @internal
         */
        _release(): void;
    }
}
declare module "core/stats" {
    /**
     * Stats for performance measurements
     */
    export class Stats {
        private _timeOfLastUpdate;
        private _partialCycleCount;
        private _cyclesPerSecond;
        /**
         * Constructor
         */
        constructor();
        /**
         * Update stats - call every frame
         */
        update(): void;
        /**
         * Reset stats
         */
        reset(): void;
        /**
         * Number of cycles per second
         */
        get cyclesPerSecond(): number;
        /**
         * A measurement of time, in milliseconds
         * @returns time in ms
         */
        private _now;
    }
}
declare module "ui/gizmos" {
    import { Viewport } from "core/viewport";
    import { Tracker } from "trackers/tracker";
    /**
     * Visual cues for testing & debugging
     */
    export class Gizmos {
        /** Should we render the gizmos? */
        private _visible;
        /** Gizmos renderer of Image Trackers */
        private _imageTrackerGizmos;
        /**
         * Constructor
         */
        constructor();
        /**
         * Whether or not the gizmos will be rendered
         */
        get visible(): boolean;
        /**
         * Whether or not the gizmos will be rendered
         */
        set visible(visible: boolean);
        /**
         * Render gizmos
         * @param viewport
         * @param trackers
         * @internal
         */
        _render(viewport: Viewport, trackers: Tracker[]): void;
    }
}
declare module "core/frame" {
    import { Session } from "core/session";
    import { TrackerResult } from "trackers/tracker";
    /**
     * A Frame holds information used to render a single animation frame of a Session
     */
    export class Frame {
        /** A reference to the session */
        private readonly _session;
        /** Results of all trackers (in the current frame) */
        private readonly _results;
        /**
         * Constructor
         * @param session
         * @param results
         */
        constructor(session: Session, results: TrackerResult[]);
        /**
         * The session of which this frame holds data
         */
        get session(): Session;
        /**
         * The results of all trackers in this frame
         */
        get results(): Iterable<TrackerResult>;
    }
}
declare module "core/time-manager" {
    /**
     * Time Manager
     */
    export class TimeManager {
        /** time scale */
        private _scale;
        /** time since the start of the session, in milliseconds */
        private _time;
        /** unscaled time since the start of the session, in milliseconds */
        private _unscaledTime;
        /** elapsed time between the current and the previous frame, in milliseconds */
        private _delta;
        /** time of the first update call, in milliseconds */
        private _firstUpdate;
        /** time of the last update call, in milliseconds */
        private _lastUpdate;
        /**
         * Update the Time Manager
         * @param timestamp in milliseconds
         * @internal
         */
        _update(timestamp: DOMHighResTimeStamp): void;
        /**
         * Elapsed time since the start of the session, measured at the
         * beginning of the current animation frame and given in seconds
         */
        get elapsed(): number;
        /**
         * Elapsed time between the current and the previous animation
         * frame, given in seconds
         */
        get delta(): number;
        /**
         * Time scale (defaults to 1)
         */
        get scale(): number;
        /**
         * Time scale (defaults to 1)
         */
        set scale(scale: number);
        /**
         * Time scale independent elapsed time since the start of the session,
         * measured at the beginning of the current animation frame and given
         * in seconds
         */
        get unscaled(): number;
    }
}
declare module "utils/asap" {
    /**
     * Schedule a function to run "as soon as possible"
     * @param fn callback
     * @param params optional parameters
     */
    export function asap(fn: Function, ...params: any[]): void;
}
declare module "core/session" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { Nullable } from "utils/utils";
    import { AREvent, AREventTarget } from "utils/ar-events";
    import { Viewport } from "core/viewport";
    import { Gizmos } from "ui/gizmos";
    import { Frame } from "core/frame";
    import { Tracker } from "trackers/tracker";
    import { TimeManager } from "core/time-manager";
    import { Source } from "sources/source";
    /** Session mode */
    export type SessionMode = 'immersive' | 'inline';
    /** Session options */
    export interface SessionOptions {
        /** session mode */
        mode?: SessionMode;
        /** trackers */
        trackers: Tracker[];
        /** sources of data */
        sources: Source[];
        /** viewport */
        viewport: Nullable<Viewport>;
        /** show stats? */
        stats?: boolean;
        /** Render gizmos? */
        gizmos?: boolean;
    }
    /** requestAnimationFrame callback */
    type SessionRequestAnimationFrameCallback = (time: DOMHighResTimeStamp, frame: Frame) => void;
    /** requestAnimationFrame callback handle */
    type SessionRequestAnimationFrameHandle = symbol;
    /** All possible event types emitted by a Session */
    type SessionEventType = 'end';
    /** An event emitted by a Session */
    class SessionEvent extends AREvent<SessionEventType> {
    }
    /**
     * A Session represents an intent to display AR content
     * and encapsulates the main loop (update-render cycle)
     */
    export class Session extends AREventTarget<SessionEvent> {
        /** Number of active sessions */
        private static _count;
        /** Session mode */
        private readonly _mode;
        /** Attached trackers */
        private _trackers;
        /** Sources of data */
        private readonly _sources;
        /** Rendering viewport */
        private readonly _viewport;
        /** Primary source of data */
        private readonly _primarySource;
        /** Time Manager */
        private _time;
        /** Is the session currently active? */
        private _active;
        /** Whether or not the frame is ready to be rendered */
        private _frameReady;
        /** Request animation frame callback queue */
        private _rafQueue;
        /** Update stats (GPU cycles/s) */
        private _updateStats;
        /** Render stats (FPS) */
        private _renderStats;
        /** Gizmos */
        private _gizmos;
        /**
         * Constructor
         * @param sources previously initialized sources of data
         * @param mode session mode
         * @param viewport viewport
         * @param stats render stats panel?
         * @param gizmos render gizmos?
         */
        private constructor();
        /**
         * Checks if the engine can be run in the browser the client is using
         * @returns true if the engine is compatible with the browser
         */
        static isSupported(): boolean;
        /**
         * Instantiate a session
         * @param options options
         * @returns a promise that resolves to a new session
         */
        static instantiate(options?: SessionOptions): SpeedyPromise<Session>;
        /**
         * Number of active sessions
         */
        static get count(): number;
        /**
         * End the session
         * @returns promise that resolves after the session is shut down
         */
        end(): SpeedyPromise<void>;
        /**
         * Analogous to window.requestAnimationFrame()
         * @param callback
         * @returns a handle
         */
        requestAnimationFrame(callback: SessionRequestAnimationFrameCallback): SessionRequestAnimationFrameHandle;
        /**
         * Analogous to window.cancelAnimationFrame()
         * @param handle a handle returned by this.requestAnimationFrame()
         */
        cancelAnimationFrame(handle: SessionRequestAnimationFrameHandle): void;
        /**
         * Session mode
         */
        get mode(): SessionMode;
        /**
         * Whether or not the session has been ended
         */
        get ended(): boolean;
        /**
         * Time Manager
         */
        get time(): TimeManager;
        /**
         * Visual cues for testing & debugging
         */
        get gizmos(): Gizmos;
        /**
         * Rendering viewport
         */
        get viewport(): Viewport;
        /**
         * Attached trackers
         */
        get trackers(): Iterable<Tracker>;
        /**
         * Sources of data
         */
        get sources(): Iterable<Source>;
        /**
         * Start the main loop
         */
        private _startMainLoop;
        /**
         * Find the primary source of data (generally a camera stream)
         * @param sources
         * @returns the primary source, or null if there isn't any
         */
        private _findPrimarySource;
        /**
         * Attach a tracker to the session
         * @param tracker
         * @returns a promise that resolves as soon as the tracker is attached and initialized
         */
        private _attachTracker;
        /**
         * Render content to the background canvas
         */
        private _renderBackground;
        /**
         * Render a SpeedyMedia
         * @param ctx rendering context
         * @param media
         * @param stretch
         */
        private _renderMedia;
        /**
         * Setup the update loop
         */
        private _setupUpdateLoop;
        /**
         * The core of the update loop
         */
        private _update;
        /**
         * Setup the render loop
         */
        private _setupRenderLoop;
        /**
         * Render a frame (RAF callback)
         * @param time current time, in ms
         * @param skipUserMedia skip copying the pixels of the user media to the background canvas in order to reduce the processing load (video stream is probably at 30fps?)
         */
        private _render;
    }
}
declare module "core/settings" {
    /** Power preference (may impact performance x battery life) */
    export type PowerPreference = 'default' | 'low-power' | 'high-performance';
    /**
     * Global Settings
     */
    export class Settings {
        private static _powerPreference;
        /**
         * Power preference (may impact performance x battery life)
         */
        static get powerPreference(): PowerPreference;
        /**
         * Power preference (may impact performance x battery life)
         * Note: this setting should be the very first thing you set
         * (before the WebGL context is created by Speedy)
         */
        static set powerPreference(value: PowerPreference);
    }
}
declare module "trackers/tracker-factory" {
    import { ImageTracker, ImageTrackerOptions } from "trackers/image-tracker/image-tracker";
    import { PointerTracker, PointerTrackerOptions } from "trackers/pointer-tracker/pointer-tracker";
    /**
     * Tracker factory
     */
    export class TrackerFactory {
        /**
         * Create an Image Tracker
         * @param options
         */
        static Image(options?: ImageTrackerOptions): ImageTracker;
        /**
         * Create an Image Tracker with default settings
         * @deprecated use Image() instead
         */
        static ImageTracker(): ImageTracker;
        /**
         * Create a Pointer Tracker
         * @param options
         */
        static Pointer(options?: PointerTrackerOptions): PointerTracker;
    }
}
declare module "sources/camera-source" {
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { Resolution } from "utils/resolution";
    import { VideoSource } from "sources/video-source";
    /**
     * Options for spawning a Webcam-based source of data
     */
    export interface CameraSourceOptions {
        /** resolution type for the captured images */
        resolution?: Resolution;
        /** a hint for the desired aspect ratio */
        aspectRatio?: number;
        /** additional video constraints to be passed to navigator.mediaDevices.getUserMedia() */
        constraints?: MediaTrackConstraints;
    }
    /**
     * Webcam-based source of data
     */
    export class CameraSource extends VideoSource {
        /** Options of the constructor */
        private _options;
        /**
         * Constructor
         * @param options
         */
        constructor(options: CameraSourceOptions);
        /**
         * Camera resolution
         */
        get resolution(): Resolution;
        /**
         * Initialize this source of data
         * @returns a promise that resolves as soon as this source of data is initialized
         * @internal
         */
        _init(): SpeedyPromise<void>;
        /**
         * Release this source of data
         * @returns a promise that resolves as soon as this source of data is released
         * @internal
         */
        _release(): SpeedyPromise<void>;
    }
}
declare module "sources/source-factory" {
    import { VideoSource } from "sources/video-source";
    import { CanvasSource } from "sources/canvas-source";
    import { CameraSource, CameraSourceOptions } from "sources/camera-source";
    import { PointerSource } from "sources/pointer-source";
    /**
     * Factory of sources of data
     */
    export class SourceFactory {
        /**
         * Create a <video>-based source of data
         * @param video video element
         * @returns a video source
         */
        static Video(video: HTMLVideoElement): VideoSource;
        /**
         * Create a <canvas>-based source of data
         * @param canvas canvas element
         * @returns a canvas source
         */
        static Canvas(canvas: HTMLCanvasElement): CanvasSource;
        /**
         * Create a Webcam-based source of data
         * @param options optional options object
         * @returns a camera source
         */
        static Camera(options?: CameraSourceOptions): CameraSource;
        /**
         * Create a source of pointer-based input
         * @returns a pointer source
        */
        static Pointer(): PointerSource;
    }
}
declare module "main" {
    import Speedy from 'speedy-vision';
    import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';
    import { Settings } from "core/settings";
    import { Session, SessionOptions } from "core/session";
    import { TrackerFactory } from "trackers/tracker-factory";
    import { SourceFactory } from "sources/source-factory";
    import { Viewport, ViewportSettings } from "core/viewport";
    import { Vector2 } from "geometry/vector2";
    import { Vector3 } from "geometry/vector3";
    /**
     * GPU-accelerated Augmented Reality for the web
     */
    export class AR {
        /**
         * Start a new session
         * @param options
         * @returns a promise that resolves to a new session
         */
        static startSession(options?: SessionOptions): SpeedyPromise<Session>;
        /**
         * Checks if the engine can be run in the browser the client is using
         * @returns true if the engine is compatible with the browser
         */
        static isSupported(): boolean;
        /**
         * Engine version
         */
        static get version(): string;
        /**
         * Speedy Vision
         */
        static get Speedy(): typeof Speedy;
        /**
         * Trackers
         */
        static get Tracker(): typeof TrackerFactory;
        /**
         * Sources of data
         */
        static get Source(): typeof SourceFactory;
        /**
         * Create a viewport
         * @param settings
         * @returns a new viewport with the specified settings
         */
        static Viewport(settings: ViewportSettings): Viewport;
        /**
         * Create a new 2D vector
         * @param x x-coordinate
         * @param y y-coordinate
         * @returns a new 2D vector with the provided coordinates
         */
        static Vector2(x: number, y: number): Vector2;
        /**
         * Create a new 3D vector
         * @param x x-coordinate
         * @param y y-coordinate
         * @param z z-coordinate
         * @returns a new 3D vector with the provided coordinates
         */
        static Vector3(x: number, y: number, z: number): Vector3;
        /**
         * Global Settings
         */
        static get Settings(): typeof Settings;
    }
}
