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

        const tracker = AR.Tracker.ImageTracker();
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
     * Initialization
     * @param {ARSystem} ar
     * @returns {Promise<void>}
     */
    async init(ar)
    {
        // Do not automatically play an animation when loading GLTF models
        BABYLON.SceneLoader.OnPluginActivatedObservable.add(loader => {
            if(loader.name == 'gltf') {
                loader.animationStartMode = BABYLON.GLTFLoaderAnimationStartMode.NONE;
            }
        });

        // Change the point of view - slightly
        ar.root.position.y = -0.8;

        // Initialize objects
        this._initLight(ar);
        this._initText(ar);
        this._initMagicCircle(ar);

        await Promise.all([
            this._initMage(ar),
            this._initCat(ar),
        ]);

        // done!
        this._initialized = true;
    }

    /**
     * Animation loop
     * @param {ARSystem} ar
     * @returns {void}
     */
    update(ar)
    {
        const delta = ar.session.time.delta; // given in seconds

        this._animateMagicCircle(delta);
    }


    // ------------------------------------------------------------------------


    _initLight(ar)
    {
        const light = new BABYLON.HemisphericLight('light', BABYLON.Vector3.Up());
        light.intensity = 1.0;
        light.diffuse.set(1, 1, 0.9);
        light.specular.set(0, 0, 0);
    }

    _initMagicCircle(ar)
    {
        // create a magic circle
        const magicCircle = BABYLON.MeshBuilder.CreatePlane('magic-circle', {
            width: 1,
            height: 1,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        });

        magicCircle.material = new BABYLON.StandardMaterial('magic-circle-material');
        magicCircle.material.diffuseTexture = new BABYLON.Texture('../assets/magic-circle.png');
        magicCircle.material.diffuseTexture.hasAlpha = true;
        magicCircle.material.useAlphaFromDiffuseTexture = true;
        magicCircle.material.diffuseColor.set(0, 0, 0);
        magicCircle.material.emissiveColor.set(1, 1, 1);
        magicCircle.material.unlit = true;
        magicCircle.rotation.set(-Math.PI / 2, 0, 0);
        magicCircle.scaling.set(4, 4, 1);

        // make it a child of ar.root
        magicCircle.parent = ar.root;

        // save a reference
        this._objects.magicCircle = magicCircle;
    }

    _initText(ar)
    {
        const text = BABYLON.MeshBuilder.CreatePlane('text', {
            width: 1,
            height: 1,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        });

        text.material = new BABYLON.StandardMaterial('text-material');
        text.material.diffuseTexture = new BABYLON.Texture('../assets/it-works.png');
        text.material.diffuseTexture.hasAlpha = true;
        text.material.useAlphaFromDiffuseTexture = true;
        text.material.diffuseColor.set(0, 0, 0);
        text.material.emissiveColor.set(1, 1, 1);
        text.material.unlit = true;
        text.position.set(0, 2, 0.5);
        text.scaling.set(3, 1.5, 1);

        text.parent = ar.root;

        this._objects.text = text;
    }

    async _initMage(ar)
    {
        // load the mage
        const gltf = await BABYLON.SceneLoader.ImportMeshAsync('', '../assets/', 'mage.glb');
        const mage = gltf.meshes[0];
        mage.scaling.set(0.7, 0.7, 0.7);

        // play an animation
        const anim = gltf.animationGroups.find(anim => anim.name == 'Idle');
        if(anim)
            anim.play(true);

        // make the mage a child of ar.root
        mage.parent = ar.root;

        // save a reference
        this._objects.mage = mage;
    }

    async _initCat(ar)
    {
        const gltf = await BABYLON.SceneLoader.ImportMeshAsync('', '../assets/', 'cat.glb');
        const cat = gltf.meshes[0];
        cat.scaling.set(0.7, 0.7, 0.7);

        const anim = gltf.animationGroups.find(anim => anim.name == 'Cheer');
        if(anim)
            anim.play(true);

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
