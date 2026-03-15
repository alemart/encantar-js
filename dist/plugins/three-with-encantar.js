/*!
 * three.js plugin for encantar.js
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 * @license LGPL-3.0-or-later
 */

import * as AR from 'encantar';
import * as THREE from 'three';

/* Usage of the indicated versions is encouraged */
USING({
    'encantar.js': { version: '0.4.6' },
       'three.js': { version: '173' }
});

/**
 * Base class for Augmented Reality experiences
 * @abstract
 */
export class ARDemo
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
     * @returns {void | Promise<void>}
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
     * @returns {Promise<void>}
     */
    preload()
    {
        return Promise.resolve();
    }

    /**
     * User-provided canvas (optional)
     * If provided, use it in your AR Viewport
     * @returns {HTMLCanvasElement | null}
     */
    get canvas()
    {
        return null;
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
export function encantar(demo)
{
    const ar = new ARSystem();
    let _tmpMat = null;

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
            if(result.of('image-tracker')) {
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
            else if(result.of('pointer-tracker')) {
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

        _tmpMat.fromArray(viewMatrixInverse.read());
        _tmpMat.decompose(ar._camera.position, ar._camera.quaternion, ar._camera.scale);

        _tmpMat.fromArray(modelMatrix.read());
        _tmpMat.decompose(ar._origin.position, ar._origin.quaternion, ar._origin.scale);
    }

    function create3DEngine(canvas)
    {
        ar._scene = new THREE.Scene();
        ar._renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
        });
    }

    function awake()
    {
        demo._ar = ar;

        // if possible, create the 3D engine before preloading the assets
        if(demo.canvas !== null) {
            create3DEngine(demo.canvas);
            demo.canvas.hidden = true;
        }
    }

    // start the lifecycle
    return Promise.resolve()
    .then(() => awake())
    .then(() => demo.preload())
    .then(() => demo.startSession()) // Promise or SpeedyPromise
    .then(session => {

        ar._session = session;

        // setup the 3D engine
        if(!ar._renderer)
            create3DEngine(session.viewport.canvas);
        else if(demo.canvas === session.viewport.canvas)
            demo.canvas.hidden = false;
        else {
            session.end();
            throw new Error('ar-canvas mismatch'); // Tip: check your AR viewport
        }

        // create auxiliary variable
        _tmpMat = new THREE.Matrix4();

        // setup camera
        ar._camera = new THREE.PerspectiveCamera();
        ar._scene.add(ar._camera);

        // setup scene hierarchy
        ar._origin = new THREE.Group();
        ar._origin.visible = false;
        ar._scene.add(ar._origin);

        ar._root = new THREE.Group();
        ar._origin.add(ar._root);

        // setup event listeners
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

        // initialize the demo and start the main loop
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
        try {
            const versionOf = { 'encantar.js': AR.version.replace(/-.*$/, ''), 'three.js': THREE.REVISION };
            const check = (x,v,w) => v != w ? console.warn(`\n\n\nWARNING\n\nThis plugin has been tested with ${x} version ${v}. The version in use is ${w}. Usage of ${x} version ${v} is recommended instead.\n\n\n`) : void 0;
            for(const [lib, expected] of Object.entries(libs))
                check(lib, expected.version, versionOf[lib]);
        }
        catch(e) {
            alert(e.message);
        }
    });
}
