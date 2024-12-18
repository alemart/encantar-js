/**
 * babylon.js plugin for encantar.js
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 * @license LGPL-3.0-or-later
 */

/* Usage of the indicated versions is encouraged */
__THIS_PLUGIN_HAS_BEEN_TESTED_WITH__({
    'encantar.js': { version: '0.4.0' },
     'babylon.js': { version: '7.38.0' }
});

/**
 * Base class for Augmented Reality experiences
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
     * @abstract
     */
    init()
    {
        throw new Error('Abstract method');
    }

    /**
     * Animation loop
     * @returns {void}
     * @abstract
     */
    update()
    {
        throw new Error('Abstract method');
    }

    /**
     * Release resources
     * @returns {void}
     */
    release()
    {
        // optional implementation
    }

    /**
     * Preload resources before starting the AR session
     * @returns {Promise<void> | SpeedyPromise<void>}
     */
    preload()
    {
        // optional implementation
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
     * Convert an AR Vector2 to a BABYLON Vector2
     * @param {Vector2} v
     * @returns {BABYLON.Vector2}
     */
    convertVector2(v)
    {
        return new BABYLON.Vector2(v.x, v.y);
    }

    /**
     * Convert an AR Vector3 to a BABYLON Vector3
     * @param {Vector3} v
     * @returns {BABYLON.Vector3}
     */
    convertVector3(v)
    {
        return new BABYLON.Vector3(v.x, v.y, v.z);
    }

    /**
     * Convert an AR Quaternion to a BABYLON Quaternion
     * @param {Quaternion} q
     * @returns {BABYLON.Quaternion}
     */
    convertQuaternion(q)
    {
        return new BABYLON.Quaternion(q.x, q.y, q.z, q.w);
    }

    /**
     * Convert an AR Ray to a BABYLON Ray
     * @param {Ray} r
     * @returns {BABYLON.Ray}
     */
    convertRay(r)
    {
        const origin = this.convertVector3(r.origin);
        const direction = this.convertVector3(r.direction);
        return new BABYLON.Ray(origin, direction);
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
     * Make sure to add a PointerTracker to your session in order to use these
     * @returns {TrackablePointer[]}
     */
    get pointers()
    {
        return this._pointers;
    }

    /**
     * The root is a node that is automatically aligned to the physical scene.
     * Objects of your virtual scene should be descendants of this node.
     * @returns {BABYLON.TransformNode}
     */
    get root()
    {
        return this._root;
    }

    /**
     * The babylon.js scene
     * @returns {BABYLON.Scene}
     */
    get scene()
    {
        return this._scene;
    }

    /**
     * A camera that is automatically adjusted for AR
     * @returns {BABYLON.Camera}
     */
    get camera()
    {
        return this._camera;
    }

    /**
     * The babylon.js engine
     * @returns {BABYLON.Engine}
     */
    get engine()
    {
        return this._engine;
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
        this._scene = null;
        this._camera = null;
        this._engine = null;
        this._utils = new ARUtils();
    }
}

/**
 * Enchant babylon.js with encantar.js!
 * @param {ARDemo} demo
 * @returns {Promise<ARSystem>}
 */
function encantar(demo)
{
    const ar = new ARSystem();
    const flipZ = new BABYLON.Matrix().copyFromFloats(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0,-1, 0,
        0, 0, 0, 1
    );

    function animate(time, frame)
    {
        ar._frame = frame;
        mix(frame);

        ar._engine.beginFrame();
        demo.update();
        ar._scene.render(false);
        ar._engine.endFrame();

        ar._session.requestAnimationFrame(animate);
    }

    function mix(frame)
    {
        let found = false;
        ar._viewer = null;
        ar._pointers.length = 0;

        for(const result of frame.results) {
            if(result.tracker.type == 'image-tracker') {
                if(result.trackables.length > 0) {
                    const trackable = result.trackables[0];
                    const projectionMatrix = result.viewer.view.projectionMatrix;
                    const viewMatrix = result.viewer.pose.viewMatrix;
                    const modelMatrix = trackable.pose.transform.matrix;

                    align(projectionMatrix, viewMatrix, modelMatrix);
                    ar._origin.setEnabled(true);
                    ar._viewer = result.viewer;

                    found = true;
                }
            }
            else if(result.tracker.type == 'pointer-tracker') {
                if(result.trackables.length > 0)
                    ar._pointers.push.apply(ar._pointers, result.trackables);
            }
        }

        if(!found)
            ar._origin.setEnabled(false);
    }

    function align(projectionMatrix, viewMatrix, modelMatrix)
    {
        if(ar._scene.useRightHandedSystem)
            ar._camera.freezeProjectionMatrix(convert(projectionMatrix));
        else
            ar._camera.freezeProjectionMatrix(convert(projectionMatrix).multiply(flipZ));

        ar._camera.setViewMatrix(convert(viewMatrix));

        convert(modelMatrix).decomposeToTransformNode(ar._origin);
    }

    function convert(matrix)
    {
        // encantar.js uses column vectors stored in column-major format,
        // whereas babylon.js uses row vectors stored in row-major format
        // (y = Ax vs y = xA). So, we return the transpose of the transpose.
        return new BABYLON.Matrix().fromArray(matrix.read());
    }

    return Promise.resolve()
    .then(() => demo.preload())
    .then(() => demo.startSession()) // Promise or SpeedyPromise
    .then(session => {

        demo._ar = ar;

        ar._session = session;

        BABYLON.Engine.prototype.resize = function(forceSetSize = false) {
            // make babylon.js respect the resolution of the viewport
            const size = session.viewport.virtualSize;
            this.setSize(size.width, size.height, forceSetSize);
        };
        ar._engine = new BABYLON.Engine(session.viewport.canvas, false, {
            premultipliedAlpha: true
        });

        ar._scene = new BABYLON.Scene(ar._engine);
        ar._scene.useRightHandedSystem = true;
        ar._scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
        ar._scene._inputManager._updatePointerPosition = function(evt) {
            // adjust babylon.js pointers to the resolution of the viewport
            const engine = this._scene.getEngine();
            const canvasRect = engine.getInputElementClientRect();
            if(!canvasRect)
                return;
            this._pointerX = (evt.clientX - canvasRect.left) * (engine.getRenderWidth() / canvasRect.width);
            this._pointerY = (evt.clientY - canvasRect.top) * (engine.getRenderHeight() / canvasRect.height);
            this._unTranslatedPointerX = this._pointerX;
            this._unTranslatedPointerY = this._pointerY;
        };

        ar._origin = new BABYLON.TransformNode('ar-origin', ar._scene);
        ar._root = new BABYLON.TransformNode('ar-root', ar._scene);
        ar._root.parent = ar._origin;
        ar._origin.setEnabled(false);

        ar._camera = new BABYLON.Camera('ar-camera', BABYLON.Vector3.Zero(), ar._scene);
        ar._camera._tmpQuaternion = BABYLON.Quaternion.Identity();
        ar._camera._customViewMatrix = BABYLON.Matrix.Identity();
        ar._camera._getViewMatrix = function() { return this._customViewMatrix; };
        ar._camera.setViewMatrix = function(matrix) {
            this._customViewMatrix = matrix;
            this.getViewMatrix(true);
            this.getWorldMatrix().decompose(undefined, this._tmpQuaternion, this.position);
            BABYLON.Axis.Y.rotateByQuaternionToRef(this._tmpQuaternion, this.upVector);
            this._globalPosition.copyFrom(this.position);
        };

        session.addEventListener('end', event => {
            ar._origin.setEnabled(false);
            ar._viewer = null;
            ar._frame = null;
            ar._pointers.length = 0;
        });

        session.viewport.addEventListener('resize', event => {
            ar._engine.resize();
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
function __THIS_PLUGIN_HAS_BEEN_TESTED_WITH__(libs)
{
    window.addEventListener('load', () => {
        try { AR, BABYLON;
            const versionOf = { 'encantar.js': AR.version.replace(/-.*$/, ''), 'babylon.js': BABYLON.Engine.Version };
            const check = (x,v,w) => v != w ? console.warn(`\n\n\nWARNING\n\nThis plugin has been tested with ${x} version ${v}. The version in use is ${w}. Usage of ${x} version ${v} is recommended instead.\n\n\n`) : void 0;
            for(const [lib, expected] of Object.entries(libs))
                check(lib, expected.version, versionOf[lib]);
        }
        catch(e) {
            alert(e.message);
        }
    });
}
