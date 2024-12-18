/**
 * three.js plugin for encantar.js
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 * @license LGPL-3.0-or-later
 */

/* Usage of the indicated versions is encouraged */
__THIS_PLUGIN_HAS_BEEN_TESTED_WITH__({
    'encantar.js': { version: '0.4.0' },
       'three.js': { version: '147' }
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
     * Convert an AR Vector2 to a THREE Vector2
     * @param {Vector2} v
     * @returns {THREE.Vector2}
     */
    convertVector2(v)
    {
        return new THREE.Vector2(v.x, v.y);
    }

    /**
     * Convert an AR Vector3 to a THREE Vector3
     * @param {Vector3} v
     * @returns {THREE.Vector3}
     */
    convertVector3(v)
    {
        return new THREE.Vector3(v.x, v.y, v.z);
    }

    /**
     * Convert an AR Quaternion to a THREE Quaternion
     * @param {Quaternion} q
     * @returns {THREE.Quaternion}
     */
    convertQuaternion(q)
    {
        return new THREE.Quaternion(q.x, q.y, q.z, q.w);
    }

    /**
     * Convert an AR Ray to a THREE Ray
     * @param {Ray} r
     * @returns {THREE.Ray}
     */
    convertRay(r)
    {
        const origin = this.convertVector3(r.origin);
        const direction = this.convertVector3(r.direction);
        return new THREE.Ray(origin, direction);
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
     * @returns {THREE.Group}
     */
    get root()
    {
        return this._root;
    }

    /**
     * The three.js scene
     * @returns {THREE.Scene}
     */
    get scene()
    {
        return this._scene;
    }

    /**
     * A camera that is automatically adjusted for AR
     * @returns {THREE.Camera}
     */
    get camera()
    {
        return this._camera;
    }

    /**
     * The three.js renderer
     * @returns {THREE.WebGLRenderer}
     */
    get renderer()
    {
        return this._renderer;
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
        this._renderer = null;
        this._utils = new ARUtils();
    }
}

/**
 * Enchant three.js with encantar.js!
 * @param {ARDemo} demo
 * @returns {Promise<ARSystem>}
 */
function encantar(demo)
{
    const ar = new ARSystem();

    function animate(time, frame)
    {
        ar._frame = frame;
        mix(frame);

        demo.update();

        ar._renderer.render(ar._scene, ar._camera);
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
                    const viewMatrixInverse = result.viewer.pose.transform.matrix;
                    const modelMatrix = trackable.pose.transform.matrix;

                    align(projectionMatrix, viewMatrixInverse, modelMatrix);
                    ar._origin.visible = true;
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
            ar._origin.visible = false;
    }

    function align(projectionMatrix, viewMatrixInverse, modelMatrix)
    {
        ar._camera.projectionMatrix.fromArray(projectionMatrix.read());
        ar._camera.projectionMatrixInverse.copy(ar._camera.projectionMatrix).invert();
        ar._camera.matrix.fromArray(viewMatrixInverse.read());
        ar._camera.updateMatrixWorld(true);
        ar._origin.matrix.fromArray(modelMatrix.read());
        ar._origin.updateMatrixWorld(true);
    }

    return Promise.resolve()
    .then(() => demo.preload())
    .then(() => demo.startSession()) // Promise or SpeedyPromise
    .then(session => {

        demo._ar = ar;

        ar._session = session;

        ar._scene = new THREE.Scene();

        ar._origin = new THREE.Group();
        ar._origin.matrixAutoUpdate = false;
        ar._origin.visible = false;
        ar._scene.add(ar._origin);

        ar._root = new THREE.Group();
        ar._origin.add(ar._root);

        ar._camera = new THREE.PerspectiveCamera();
        ar._camera.matrixAutoUpdate = false;

        ar._renderer = new THREE.WebGLRenderer({
            canvas: session.viewport.canvas,
            alpha: true,
        });

        session.addEventListener('end', event => {
            ar._origin.visible = false;
            ar._viewer = null;
            ar._frame = null;
            ar._pointers.length = 0;
        });

        session.viewport.addEventListener('resize', event => {
            const size = session.viewport.virtualSize;
            ar._renderer.setPixelRatio(1.0);
            ar._renderer.setSize(size.width, size.height, false);
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
        try { AR, __THREE__;
            const versionOf = { 'encantar.js': AR.version.replace(/-.*$/, ''), 'three.js': __THREE__ };
            const check = (x,v,w) => v != w ? console.warn(`\n\n\nWARNING\n\nThis plugin has been tested with ${x} version ${v}. The version in use is ${w}. Usage of ${x} version ${v} is recommended instead.\n\n\n`) : void 0;
            for(const [lib, expected] of Object.entries(libs))
                check(lib, expected.version, versionOf[lib]);
        }
        catch(e) {
            alert(e.message);
        }
    });
}
