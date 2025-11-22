/**
 * Augmented Reality demo using the PlayCanvas plugin for encantar.js
 * Ported from the Three.js version
 */

/**
 * Utilities for the Demo
 * Abstraction layer for PlayCanvas asset loading and primitive creation
 */
class Utils
{
    /**
     * Load a GLB container URL
     * @param {pc.Application} app 
     * @param {string} url 
     * @param {string} name 
     * @returns {Promise<pc.Entity>}
     */
    static loadGLB(app, url, name) {
        return new Promise((resolve, reject) => {
            const asset = new pc.Asset(name, 'container', { url: url });
            app.assets.add(asset);
            app.assets.load(asset);
            
            asset.ready(() => {
                const entity = asset.resource.instantiateRenderEntity();
                resolve(entity);
            });
            
            asset.on('error', err => reject(err));
        });
    }

    /**
     * Load a texture from URL
     * @param {pc.Application} app 
     * @param {string} url 
     * @returns {Promise<pc.Asset>}
     */
    static loadTexture(app, url) {
        return new Promise((resolve, reject) => {
            app.assets.loadFromUrl(url, 'texture', (err, asset) => {
                if (err) reject(err);
                else resolve(asset);
            });
        });
    }

    /**
     * Create a plane with a texture (Unlit material)
     * @param {pc.Application} app 
     * @param {pc.Asset} textureAsset 
     * @returns {pc.Entity}
     */
    static createImagePlane(app, textureAsset)
    {
        // Setup material (Unlit / Transparent)
        const material = new pc.StandardMaterial();
        material.diffuseMap = textureAsset.resource;
        material.opacityMap = textureAsset.resource; // Assumes alpha in texture
        material.blendType = pc.BLEND_NORMAL;
        material.useLighting = false; // Emulate MeshBasicMaterial
        material.cull = pc.CULLFACE_NONE; // DoubleSide
        material.update();

        // Setup Entity
        const entity = new pc.Entity();
        entity.addComponent('render', {
            type: 'plane',
            material: material
        });
        
        // PlayCanvas planes are XZ by default. Rotate to XY for consistency with Three.js logic
        entity.setLocalEulerAngles(90, 0, 0); 

        return entity;
    }

    /**
     * Adjust root rotation for front view
     * @param {ARSystem} ar 
     */
    static switchToFrontView(ar)
    {
        // PlayCanvas Y-up vs AR coordinates. 
        // Rotating -90 on X aligns the entities to face the camera when tracking starts.
        ar.root.setLocalEulerAngles(-90, 0, 0);
    }
}

/**
 * Augmented Reality Demo
 */
class EnchantedDemo extends ARDemo
{
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
            throw new Error('Device not compatible');
        }

        // 1. Setup Tracker
        const tracker = AR.Tracker.Image();
        await tracker.database.add([
            { name: 'mage', image: document.getElementById('mage') },
            { name: 'cat', image: document.getElementById('cat') }
        ]);

        // 2. Setup Viewport
        const viewport = AR.Viewport({
            canvas: this.canvas,
            container: document.getElementById('ar-viewport'),
            hudContainer: document.getElementById('ar-hud')
        });

        // 3. Setup Source
        const videoElement = document.getElementById('my-video');
        const source = videoElement ? AR.Source.Video(videoElement) : AR.Source.Camera();

        // 4. Start Session
        const session = await AR.startSession({
            mode: 'immersive',
            viewport: viewport,
            trackers: [ tracker ],
            sources: [ source ],
            stats: true,
            gizmos: true,
        });

        // UI Handling
        const scan = document.getElementById('scan');
        if(scan) scan.style.pointerEvents = 'none';

        tracker.addEventListener('targetfound', event => {
            session.gizmos.visible = false;
            if(scan) scan.hidden = true;
            this._onTargetFound(event.referenceImage);
        });

        tracker.addEventListener('targetlost', event => {
            session.gizmos.visible = true;
            if(scan) scan.hidden = false;
            this._onTargetLost(event.referenceImage);
        });

        return session;
    }

    /**
     * Preload assets
     * @returns {Promise<void>}
     */
    async preload()
    {
        const ar = this.ar;
        const app = ar.app;

        const [ texCircle, texText, modelMage, modelCat ] = await Promise.all([
            Utils.loadTexture(app, '../assets/magic-circle.png'),
            Utils.loadTexture(app, '../assets/it-works.png'),
            Utils.loadGLB(app, '../assets/mage.glb', 'mage'),
            Utils.loadGLB(app, '../assets/cat.glb', 'cat')
        ]);

        this._objects.assets = { texCircle, texText, modelMage, modelCat };
    }
    
    /**
     * Initialization
     * @returns {Promise<void>}
     */
    async init()
    {
        const ar = this.ar;
        const app = ar.app;

        // 1. Coordinate System Adjustment
        Utils.switchToFrontView(ar);
        ar.root.setLocalPosition(0, -0.8, 0);

        // 2. Lighting Setup (Required for StandardMaterial in PlayCanvas)
        const light = new pc.Entity('DirectionalLight');
        light.addComponent('light', {
            type: 'directional',
            color: new pc.Color(1, 1, 1),
            intensity: 1.5
        });
        light.setLocalEulerAngles(45, 0, 0);
        ar.root.addChild(light);
        
        app.scene.ambientLight = new pc.Color(0.5, 0.5, 0.5);

        // 3. Scene Composition
        const assets = this._objects.assets;
        this._initMagicCircle(assets.texCircle);
        this._initText(assets.texText);
        this._initMage(assets.modelMage);
        this._initCat(assets.modelCat);

        // done!
        this._initialized = true;
    }

    /**
     * Animation loop
     */
    update()
    {
        if (!this._initialized) return;

        const ar = this.ar;
        const delta = ar.session.time.delta;

        this._animateMagicCircle(delta);
        // GLB animations (AnimComponent/AnimationComponent) are automatically ticked by ar.app.tick() in the plugin
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
            throw new Error(`Missing ar-canvas`);

        return canvas;
    }

    // ------------------------------------------------------------------------

    _initMagicCircle(texture)
    {
        const magicCircle = Utils.createImagePlane(this.ar.app, texture);
        // Scale: X and Z are the plane dimensions
        magicCircle.setLocalScale(4, 1, 4); 
        
        this.ar.root.addChild(magicCircle);
        this._objects.magicCircle = magicCircle;
    }

    _initText(texture)
    {
        const text = Utils.createImagePlane(this.ar.app, texture);
        text.setLocalPosition(0, -0.5, 2);
        text.setLocalScale(3, 1, 1.5);
        // Rotate to face camera (90 on local X because Plane is XZ)
        text.rotateLocal(90, 0, 0); 

        this.ar.root.addChild(text);
        this._objects.text = text;
    }

    _initMage(entity)
    {
        entity.setLocalScale(0.7, 0.7, 0.7);
        this.ar.root.addChild(entity);
        this._objects.mage = entity;

        // Trigger animation if available in GLB
        this._playAnimation(entity, 'Idle');
    }

    _initCat(entity)
    {
        entity.setLocalScale(0.7, 0.7, 0.7);
        this.ar.root.addChild(entity);
        this._objects.cat = entity;
        
        this._playAnimation(entity, 'Cheer'); // Assuming 'Cheer' exists or default
    }

    _playAnimation(entity, clipName) {
        // Handle PlayCanvas 'anim' (State Graph) vs 'animation' (Legacy)
        if (entity.anim) {
            entity.anim.setFloat('speed', 1.0);
            // If the GLB has a state graph setup, playing is automatic or via triggers
        } else if (entity.animation) {
             // If legacy component, play the first clip or by name
             const clip = entity.animation.getAnimation(clipName) ? clipName : entity.animation.assets[0].name;
             if(clip) entity.animation.play(clip);
        }
    }

    _animateMagicCircle(delta)
    {
        const DEGREES_PER_SEC = 360 / 8.0; // 1 rotation every 8 seconds
        // Rotate Y axis (Up vector for the circle plane)
        this._objects.magicCircle.rotateLocal(0, -DEGREES_PER_SEC * delta, 0);
    }

    _onTargetFound(referenceImage)
    {
        if(!this._initialized) return;

        switch(referenceImage.name) {
            case 'mage':
                this._objects.mage.enabled = true;
                this._objects.cat.enabled = false;
                this._objects.text.enabled = false;
                this._setCircleColor(0.7, 0.9, 1.0); // Cyan tint
                break;

            case 'cat':
                this._objects.mage.enabled = false;
                this._objects.cat.enabled = true;
                this._objects.text.enabled = true;
                this._setCircleColor(1.0, 1.0, 0.6); // Yellow tint
                break;
        }
    }

    _setCircleColor(r, g, b) {
        // Access the first MeshInstance to modify material
        const meshInstances = this._objects.magicCircle.render.meshInstances;
        if (meshInstances.length > 0) {
            meshInstances[0].material.diffuse.set(r, g, b);
            meshInstances[0].material.update();
        }
    }

    _onTargetLost(referenceImage)
    {
        // Optional: Hide everything or pause
    }
}

// Entry Point
function main()
{
    const demo = new EnchantedDemo();
    encantar(demo).catch(error => {
        alert(error.message);
    });
}

if(document.readyState == 'loading')
    document.addEventListener('DOMContentLoaded', main);
else
    main();
