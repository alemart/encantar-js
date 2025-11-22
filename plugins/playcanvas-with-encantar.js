/*!
 * PlayCanvas plugin for encantar.js
 * @author Victor M. Feliz (MotivaCG) and Alexandre Martins
 * @license LGPL-3.0-or-later
 */

/* Usage of the indicated versions is encouraged */
USING({
    'encantar.js': { version: '0.4.6' },
     'playcanvas': { version: '2.13.0' }
});

/**
 * Base class for Augmented Reality experiences
 * @abstract
 */
class ARDemo
{
    /**
     * Start the AR session
     * @returns {Promise<Session> | SpeedyPromise<Session>}
     * @abstract
     */
    startSession()
    {
        throw new Error('Abstract method');
    }

    /**
     * Initialization
     * @returns {void | Promise<void> | SpeedyPromise<void>}
     */
    init()
    {
        return Promise.resolve();
    }

    /**
     * Animation step - called every frame
     * @returns {void}
     */
    update()
    {
    }

    /**
     * Release resources
     * @returns {void}
     */
    release()
    {
    }

    /**
     * Preload resources before starting the AR session
     * @returns {Promise<void> | SpeedyPromise<void>}
     */
    preload()
    {
        return Promise.resolve();
    }

    /**
     * A reference to the ARSystem
     * @returns {ARSystem | null}
     */
    get ar()
    {
        return this._ar;
    }

    /**
     * User-provided canvas. If provided, use it in your AR Viewport
     * @returns {HTMLCanvasElement | null}
     */
    get canvas()
    {
        return null;
    }

    /**
     * Constructor
     */
    constructor()
    {
        this._ar = null;
    }
}

/**
 * AR Utilities
 */
class ARUtils
{
    /**
     * Convert an AR Vector2 to a PlayCanvas Vec2
     * @param {Vector2} v
     * @returns {pc.Vec2}
     */
    convertVector2(v)
    {
        return new pc.Vec2(v.x, v.y);
    }

    /**
     * Convert an AR Vector3 to a PlayCanvas Vec3
     * @param {Vector3} v
     * @returns {pc.Vec3}
     */
    convertVector3(v)
    {
        return new pc.Vec3(v.x, v.y, v.z);
    }

    /**
     * Convert an AR Quaternion to a PlayCanvas Quat
     * @param {Quaternion} q
     * @returns {pc.Quat}
     */
    convertQuaternion(q)
    {
        return new pc.Quat(q.x, q.y, q.z, q.w);
    }

    /**
     * Convert an AR Ray to a PlayCanvas Ray
     * @param {Ray} r
     * @returns {pc.Ray}
     */
    convertRay(r)
    {
        const origin = this.convertVector3(r.origin);
        const direction = this.convertVector3(r.direction);
        return new pc.Ray(origin, direction);
    }
}

/**
 * Helper for creating Augmented Reality experiences
 */
class ARSystem
{
    /**
     * AR Session
     * @returns {Session}
     */
    get session()
    {
        return this._session;
    }

    /**
     * Current frame: an object holding data to augment the physical scene.
     * If the AR scene is not initialized, this will be null.
     * @returns {Frame | null}
     */
    get frame()
    {
        return this._frame;
    }

    /**
     * AR Viewer
     * @returns {Viewer | null}
     */
    get viewer()
    {
        return this._viewer;
    }

    /**
     * Pointer-based input (current frame)
     * @returns {TrackablePointer[]}
     */
    get pointers()
    {
        return this._pointers;
    }

    /**
     * The root is an Entity that is automatically aligned to the physical scene.
     * Objects of your virtual scene should be children of this entity.
     * @returns {pc.Entity}
     */
    get root()
    {
        return this._root;
    }

    /**
     * The PlayCanvas Application
     * @returns {pc.Application}
     */
    get app()
    {
        return this._app;
    }

    /**
     * A camera Entity that is automatically adjusted for AR
     * @returns {pc.Entity}
     */
    get camera()
    {
        return this._camera;
    }

    /**
     * AR Utilities
     * @returns {ARUtils}
     */
    get utils()
    {
        return this._utils;
    }

    /**
     * Constructor
     */
    constructor()
    {
        this._session = null;
        this._frame = null;
        this._viewer = null;
        this._pointers = [];
        this._origin = null;
        this._root = null;
        this._app = null; // Equivalent to engine/scene in other adapters
        this._camera = null;
        this._utils = new ARUtils();
    }
}

/**
 * Enchant PlayCanvas with encantar.js!
 * @param {ARDemo} demo
 * @returns {Promise<ARSystem>}
 */
function encantar(demo)
{
    const ar = new ARSystem();
    let _mat = null;
    let _pos = null;
    let _rot = null;
    let _scl = null;

    function animate(time, frame)
    {
        ar._frame = frame;
        mix(frame);

        demo.update();

        // Manually tick the PlayCanvas app
        // We use a small delta because AR loop handles timing
        ar._app.tick(1000 / 60); 
        
        ar._app.renderNextFrame = true;
        ar._session.requestAnimationFrame(animate);
    }

    function mix(frame)
    {
        let found = false;
        ar._viewer = null;
        ar._pointers.length = 0;

        for(const result of frame.results) {
            if(result.of('image-tracker')) {
                if(result.trackables.length > 0) {
                    const trackable = result.trackables[0];
                    const perspectiveView = result.viewer.view;
                    const viewMatrixInverse = result.viewer.pose.transform.matrix;
                    const modelMatrix = trackable.pose.transform.matrix;

                    align(perspectiveView, viewMatrixInverse, modelMatrix);
                    ar._origin.enabled = true;
                    ar._viewer = result.viewer;

                    found = true;
                }
            }
            else if(result.of('pointer-tracker')) {
                if(result.trackables.length > 0)
                    ar._pointers.push.apply(ar._pointers, result.trackables);
            }
        }

        if(!found)
            ar._origin.enabled = false;
    }

    function align(perspectiveView, viewMatrixInverse, modelMatrix)
    {
        // 1. Update Camera Projection
        // PlayCanvas uses a Mat4 property on the camera component if we want custom projection
        const camComp = ar._camera.camera;
        _mat.data.set(perspectiveView.projectionMatrix.read());
        camComp.projectionMatrix.copy(_mat);

        // some methods of the camera component depend on the projection parameters
        camComp.nearClip = perspectiveView.near;
        camComp.farClip = perspectiveView.far;
        camComp.fov = perspectiveView.fovy * pc.math.RAD_TO_DEG;
        camComp.aspectRatio = perspectiveView.aspect;

        // 2. Update Camera Pose (View Matrix Inverse)
        _mat.data.set(viewMatrixInverse.read());
        _mat.getTranslation(_pos);
        _mat.getScale(_scl);
        _rot.setFromMat4(_mat);
        ar._camera.setPosition(_pos);
        ar._camera.setRotation(_rot);
        // We generally don't scale the camera

        // 3. Update Origin/Root Pose (Model Matrix)
        _mat.data.set(modelMatrix.read());
        _mat.getTranslation(_pos);
        _mat.getScale(_scl);
        _rot.setFromMat4(_mat);
        ar._origin.setPosition(_pos);
        ar._origin.setRotation(_rot);
        ar._origin.setLocalScale(_scl);
    }

    function create3DEngine(canvas)
    {
        ar._app = new pc.Application(canvas, {
            graphicsDeviceOptions: {
                alpha: true,
                preserveDrawingBuffer: false,
                antialias: true
            },
            mouse: new pc.Mouse(canvas),
            touch: new pc.TouchDevice(canvas)
        });
    }

    // if possible, create the 3D engine before preloading the assets
    demo._ar = ar;
    if(demo.canvas !== null)
        create3DEngine(demo.canvas);

    // start the lifecycle
    return Promise.resolve()
    .then(() => demo.preload())
    .then(() => demo.startSession())
    .then(session => {

        ar._session = session;

        // Initialize PlayCanvas Application
        const viewport = session.viewport;
        const canvas = viewport.canvas;

        if(!ar._app)
            create3DEngine(canvas);
        else if(demo.canvas !== canvas) {
            session.end();
            throw new Error('Invalid canvas. Have you checked your viewport?');
        }

        ar._app._allowResize = false; // respect the settings of the viewport; encantar alone handles the resize
        ar._app.setCanvasFillMode(pc.FILLMODE_NONE, viewport.virtualSize.width, viewport.virtualSize.height);
        ar._app.setCanvasResolution(pc.RESOLUTION_FIXED, viewport.virtualSize.width, viewport.virtualSize.height);

        ar._app.autoRender = false; // We drive the loop via encantar, not PlayCanvas internal loop
        ar._app.start();

        // Setup helper objects for matrix math to avoid GC
        _mat = new pc.Mat4();
        _pos = new pc.Vec3();
        _rot = new pc.Quat();
        _scl = new pc.Vec3();

        // Setup Scene Hierarchy
        // ar-origin (Hidden/Shown based on tracking)
        //   -> ar-root (User content goes here)
        ar._origin = new pc.Entity('ar-origin');
        ar._origin.enabled = false;
        ar._app.root.addChild(ar._origin);

        ar._root = new pc.Entity('ar-root');
        ar._origin.addChild(ar._root);

        // Setup Camera
        ar._camera = new pc.Entity('ar-camera');
        ar._camera.addComponent('camera', {
            clearColor: new pc.Color(0, 0, 0, 0), // Transparent background
            aspectRatioMode: pc.ASPECT_MANUAL
        });
        ar._camera.camera.calculateProjection = function(mat) {
             // We must override the calculateProjection method to prevent PC from overwriting it
             mat.copy(this.projectionMatrix);
             return mat;
        };
        ar._app.root.addChild(ar._camera);

        // Event Listeners
        session.addEventListener('end', event => {
            ar._origin.enabled = false;
            ar._viewer = null;
            ar._frame = null;
            ar._pointers.length = 0;
        });

        return Promise.resolve()
        .then(() => {
            return demo.init();
        })
        .then(() => {
            session.addEventListener('end', event => { demo.release(); });
            session.requestAnimationFrame(animate);
            return ar;
        })
        .catch(error => {
            session.end();
            throw error;
        });

    })
    .catch(error => {
        console.error(error);
        throw error;
    });
}

/**
 * Version check
 * @param {object} libs
 */
function USING(libs)
{
    window.addEventListener('load', () => {
        try { AR, pc;
            const versionOf = { 'encantar.js': AR.version.replace(/-.*$/, ''), 'playcanvas': pc.version };
            const check = (x,v,w) => v != w ? console.warn(`\n\n\nWARNING\n\nThis plugin has been tested with ${x} version ${v}. The version in use is ${w}. Usage of ${x} version ${v} is recommended instead.\n\n\n`) : void 0;
            for(const [lib, expected] of Object.entries(libs))
                check(lib, expected.version, versionOf[lib]);
        }
        catch(e) {
            alert(e.message);
        }
    });
}
