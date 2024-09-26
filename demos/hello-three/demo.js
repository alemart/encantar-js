window.addEventListener('load', () => {

    const my = { };

    // initialize the virtual scene
    async function init(ar)
    {
        // add lights
        const ambientLight = new THREE.AmbientLight(0xffffff);
        ar.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(0, 1, 0);
        ar.root.add(directionalLight);

        //const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 0.5);
        //ar.scene.add(directionalLightHelper);

        // create a group as a child of ar.root, which is aligned to the physical scene
        const group = createMainGroup(true);
        group.position.set(0, -0.5, 0);
        group.scale.set(0.7, 0.7, 0.7);
        ar.root.add(group);

        // create the magic circle
        const magicCircle = createPlane('../assets/magic-circle.png');
        magicCircle.material.transparent = true;
        magicCircle.material.opacity = 0.85;
        magicCircle.material.color = new THREE.Color(0xbeefff);
        magicCircle.scale.set(6, 6, 1);
        group.add(magicCircle);

        // load the mage
        const gltf = await loadGLTF('../assets/mage.glb');
        const mage = gltf.scene;
        group.add(mage);

        // prepare the animation of the mage
        const animationAction = createAnimationAction(gltf, 'Idle');
        animationAction.loop = THREE.LoopRepeat;
        animationAction.play();

        // export objects
        my.group = group;
        my.magicCircle = magicCircle;
        my.mage = mage;
        my.animationAction = animationAction;
    }

    // animate the virtual scene
    function animate(ar, deltaSeconds)
    {
        const TWO_PI = 2.0 * Math.PI;
        const ROTATIONS_PER_SECOND = 0.25;

        // animate the mage
        const mixer = my.animationAction.getMixer();
        mixer.update(deltaSeconds);

        // animate the magic circle
        my.magicCircle.rotateZ(TWO_PI * ROTATIONS_PER_SECOND * deltaSeconds);
    }

    function createMainGroup(frontView = false)
    {
        const group = new THREE.Group();

        // top view is the default
        if(frontView)
            group.rotateX(-Math.PI / 2);

        return group;
    }

    async function loadGLTF(filepath, yAxisIsUp = true)
    {
        const loader = new THREE.GLTFLoader();
        const gltf = await loader.loadAsync(filepath);

        // glTF defines +y as up. We expect +z to be up.
        if(yAxisIsUp)
            gltf.scene.rotateX(Math.PI / 2);

        return gltf;
    }

    function createAnimationAction(gltf, name = null)
    {
        const mixer = new THREE.AnimationMixer(gltf.scene);
        const clips = gltf.animations;

        if(clips.length == 0)
            throw new Error('No animation clips');

        const clip = (name !== null) ? THREE.AnimationClip.findByName(clips, name) : clips[0];
        const action = mixer.clipAction(clip);

        return action;
    }

    function createPlane(imagepath)
    {
        const texture = new THREE.TextureLoader().load(imagepath);
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);

        return mesh;
    }

    async function startARSession()
    {
        if(!AR.isSupported()) {
            throw new Error(
                'This device is not compatible with this AR experience.\n\n' +
                'User agent: ' + navigator.userAgent
            );
        }

        //AR.Settings.powerPreference = 'low-power';

        const tracker = AR.Tracker.ImageTracker();
        await tracker.database.add([{
            name: 'my-reference-image',
            image: document.getElementById('my-reference-image')
        }]);

        const viewport = AR.Viewport({
            container: document.getElementById('ar-viewport'),
            hudContainer: document.getElementById('ar-hud')
        });

        const video = document.getElementById('my-video');
        const useWebcam = (video === null);
        const source = useWebcam ?
            AR.Source.Camera({ resolution: 'md' }) :
            AR.Source.Video(video);

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
        });

        tracker.addEventListener('targetlost', event => {
            session.gizmos.visible = true;
            if(scan)
                scan.hidden = false;
        });

        return session;
    }

    // enchant!
    encantar(startARSession, animate, init);

});
