/**
 * Augmented Reality demo using the babylon.js plugin for encantar.js
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

(function() {

/**
 * Augmented Reality Demo
 */
class EnchantedDemo extends ARDemo
{
    /**
     * Constructor
     */
    constructor()
    {
        super();

        this._objects = { };
        this._initialized = false;
    }

    /**
     * Start the AR session
     * @returns {Promise<Session>}
     */
    async startSession()
    {
        if(!AR.isSupported()) {
            throw new Error(
                'This device is not compatible with this AR experience.\n\n' +
                'User agent: ' + navigator.userAgent
            );
        }

        const tracker = AR.Tracker.Image();
        await tracker.database.add([
        {
            name: 'mage',
            image: document.getElementById('mage')
        },
        {
            name: 'cat',
            image: document.getElementById('cat')
        }
        ]);

        const viewport = AR.Viewport({
            canvas: this.canvas,
            container: document.getElementById('ar-viewport'),
            hudContainer: document.getElementById('ar-hud')
        });

        const video = document.getElementById('my-video');
        const useWebcam = (video === null);
        const source = useWebcam ? AR.Source.Camera() : AR.Source.Video(video);

        const session = await AR.startSession({
            mode: 'immersive',
            viewport: viewport,
            trackers: [ tracker ],
            sources: [ source ],
            stats: true,
            gizmos: true,
        });

        const scan = document.getElementById('scan');
        if(scan)
            scan.style.pointerEvents = 'none';

        tracker.addEventListener('targetfound', event => {
            session.gizmos.visible = false;
            if(scan)
                scan.hidden = true;

            this._onTargetFound(event.referenceImage);
        });

        tracker.addEventListener('targetlost', event => {
            session.gizmos.visible = true;
            if(scan)
                scan.hidden = false;

            this._onTargetLost(event.referenceImage);
        });

        return session;
    }

    /**
     * Preload resources before starting the AR session
     * @returns {Promise<void>}
     */
    async preload()
    {
        console.log('Preloading assets...');

        // Do not automatically play an animation when loading GLTF models
        BABYLON.SceneLoader.OnPluginActivatedObservable.add(loader => {
            if(loader.name == 'gltf') {
                loader.animationStartMode = BABYLON.GLTFLoaderAnimationStartMode.NONE;
            }
        });

        // Load GLTF models
        const [ mage, cat ] = await Promise.all([
            BABYLON.ImportMeshAsync('../assets/mage.glb'),
            BABYLON.ImportMeshAsync('../assets/cat.glb')
        ]);

        // Save references
        this._objects.gltf = { mage, cat };
    }

    /**
     * Initialization
     * @returns {void}
     */
    init()
    {
        // Change the point of view - slightly
        const ar = this.ar;
        ar.root.position.y = -0.8;

        // Initialize objects
        this._initLight();
        this._initText();
        this._initMagicCircle();
        this._initMage();
        this._initCat();

        // done!
        this._initialized = true;
    }

    /**
     * Animation step - called every frame
     * @returns {void}
     */
    update()
    {
        const ar = this.ar;
        const delta = ar.session.time.delta; // given in seconds

        this._animateMagicCircle(delta);
    }

    /**
     * User-provided canvas (optional)
     * If provided, use it in your AR Viewport
     * @returns {HTMLCanvasElement | null}
     */
    get canvas()
    {
        const canvas = document.getElementById('ar-canvas');

        if(!canvas)
            throw new Error('Missing ar-canvas');

        return canvas;
    }

    // ------------------------------------------------------------------------


    _initLight()
    {
        const light = new BABYLON.HemisphericLight('light', BABYLON.Vector3.Up());

        light.intensity = 1.0;
        light.diffuse.set(1, 1, 1);
        light.groundColor.set(1, 1, 1);
        light.specular.set(0, 0, 0);
    }

    _initMagicCircle()
    {
        // create a magic circle
        const material = new BABYLON.StandardMaterial('magic-circle-material');

        material.diffuseTexture = new BABYLON.Texture('../assets/magic-circle.png');
        material.diffuseTexture.hasAlpha = true;
        material.useAlphaFromDiffuseTexture = true;
        material.diffuseColor.set(0, 0, 0);
        material.emissiveColor.set(1, 1, 1);
        material.unlit = true;

        const magicCircle = BABYLON.MeshBuilder.CreatePlane('magic-circle', {
            width: 1,
            height: 1,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        });

        magicCircle.rotation.set(-Math.PI / 2, 0, 0);
        magicCircle.scaling.set(4, 4, 1);
        magicCircle.material = material;

        // make it a child of ar.root
        const ar = this.ar;
        magicCircle.parent = ar.root;

        // save a reference
        this._objects.magicCircle = magicCircle;
    }

    _initText()
    {
        const material = new BABYLON.StandardMaterial('text-material');

        material.diffuseTexture = new BABYLON.Texture('../assets/it-works.png');
        material.diffuseTexture.hasAlpha = true;
        material.useAlphaFromDiffuseTexture = true;
        material.diffuseColor.set(0, 0, 0);
        material.emissiveColor.set(1, 1, 1);
        material.unlit = true;

        const text = BABYLON.MeshBuilder.CreatePlane('text', {
            width: 1,
            height: 1,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        });

        text.position.set(0, 2, 0.5);
        text.scaling.set(3, 1.5, 1);
        text.material = material;

        const ar = this.ar;
        text.parent = ar.root;

        this._objects.text = text;
    }

    _initMage()
    {
        // load the mage
        const gltf = this._objects.gltf.mage;
        const mage = gltf.meshes[0];
        mage.scaling.set(0.7, 0.7, 0.7);

        // play an animation
        const anim = gltf.animationGroups.find(anim => anim.name == 'Idle');
        if(anim)
            anim.play(true);

        // make the mage a child of ar.root
        const ar = this.ar;
        mage.parent = ar.root;

        // save a reference
        this._objects.mage = mage;
    }

    _initCat()
    {
        const gltf = this._objects.gltf.cat;
        const cat = gltf.meshes[0];
        cat.scaling.set(0.7, 0.7, 0.7);

        const anim = gltf.animationGroups.find(anim => anim.name == 'Cheer');
        if(anim)
            anim.play(true);

        const ar = this.ar;
        cat.parent = ar.root;

        this._objects.cat = cat;
    }

    _animateMagicCircle(delta)
    {
        const TWO_PI = 2.0 * Math.PI;
        const ROTATIONS_PER_SECOND = 1.0 / 8.0;

        this._objects.magicCircle.rotate(BABYLON.Axis.Z, -TWO_PI * ROTATIONS_PER_SECOND * delta);
    }

    _onTargetFound(referenceImage)
    {
        // make sure that the scene is initialized
        if(!this._initialized) {
            alert(`Target \"${referenceImage.name}\" was found, but the 3D scene is not yet initialized!`);
            return;
        }

        // change the scene based on the tracked image
        switch(referenceImage.name) {
            case 'mage':
                this._objects.mage.setEnabled(true);
                this._objects.cat.setEnabled(false);
                this._objects.text.setEnabled(false);
                this._objects.magicCircle.material.emissiveColor.fromHexString('#beefff');
                break;

            case 'cat':
                this._objects.mage.setEnabled(false);
                this._objects.cat.setEnabled(true);
                this._objects.text.setEnabled(true);
                this._objects.magicCircle.material.emissiveColor.fromHexString('#ffffaa');
                break;
        }
    }

    _onTargetLost(referenceImage)
    {
    }
}

/**
 * Start the Demo
 * @returns {void}
 */
function main()
{
    const demo = new EnchantedDemo();

    if(typeof encantar === 'undefined')
        throw new Error(`Can't find the babylon.js plugin for encantar.js`);

    encantar(demo).catch(error => {
        alert(error.message);
    });
}

document.addEventListener('DOMContentLoaded', main);

})();
