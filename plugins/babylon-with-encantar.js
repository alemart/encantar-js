/**
 * babylon.js plugin for encantar.js
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 * @license LGPL-3.0-or-later
 */

/* Usage of the indicated versions is encouraged */
__THIS_PLUGIN_HAS_BEEN_TESTED_WITH__({
    'encantar.js': { version: '0.4.0' },
     'babylon.js': { version: '7.29.0' }
});

/**
 * Base class for Augmented Reality experiences
 */
class ARDemo
{
    /**
     * Start the AR session
     * @abstract
     * @returns {Promise<Session> | SpeedyPromise<Session>}
     */
    startSession()
    {
        throw new Error('Abstract method');
    }

    /**
     * Initialization
     * @abstract
     * @param {ARSystem} ar
     * @returns {void | Promise<void> | SpeedyPromise<void>}
     */
    init(ar)
    {
        throw new Error('Abstract method');
    }

    /**
     * Animation loop
     * @abstract
     * @param {ARSystem} ar
     * @returns {void}
     */
    update(ar)
    {
        throw new Error('Abstract method');
    }

    /**
     * Release resources
     * @param {ARSystem} ar
     * @returns {void}
     */
    release(ar)
    {
        // optional implementation
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
     * Pointer-based input in the current frame (touch, mouse, pen...)
     * You need a PointerTracker in your session in order to use these
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
    const flipZAxis = new BABYLON.Matrix().copyFromFloats(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0,-1, 0,
        0, 0, 0, 1
    );

    function animate(time, frame)
    {
        ar._frame = frame;
        mix(frame);

        demo.update(ar);

        ar._scene.render(false);
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
            ar._camera.freezeProjectionMatrix(convert(projectionMatrix).multiply(flipZAxis));

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
    .then(() => {
        return demo.startSession(); // Promise or SpeedyPromise
    })
    .then(session => {

        ar._session = session;

        ar._engine = new BABYLON.Engine(session.viewport.canvas, false, {
            premultipliedAlpha: true
        });
        ar._engine.resize = function(forceSetSize = false) {
            // make babylon.js respect the resolution of the viewport
            const size = session.viewport.virtualSize;
            this.setSize(size.width, size.height, forceSetSize);
        };

        ar._scene = new BABYLON.Scene(ar._engine);
        ar._scene.useRightHandedSystem = true;
        ar._scene.clearColor.set(0, 0, 0, 0);

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
            return demo.init(ar);
        })
        .then(() => {
            session.addEventListener('end', event => { demo.release(ar); });
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
