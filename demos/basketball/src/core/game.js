/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview The main class of the game, which handles its lifecycle
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { ASSET_LIST } from './asset-list.js';
import { GameEvent } from './events.js';
import { EventQueue } from './event-queue.js';
import { GameController } from '../entities/game-controller.js';
import { Lights } from '../entities/lights.js';
import { Gravity } from '../entities/gravity.js';
import { Goal } from '../entities/goal.js';
import { Ball } from '../entities/ball.js';
import { BasketballNet } from '../entities/net.js';
import { ScoreText } from '../entities/score-text.js';
import { Scoreboard } from '../entities/scoreboard.js';
import { Jukebox } from '../entities/jukebox.js';
import { BallCounter } from '../entities/gui/ball-counter.js';
import { MuteButton } from '../entities/gui/mute-button.js';
import { TutorialOverlay } from '../entities/gui/tutorial-overlay.js';
import { GameOverOverlay } from '../entities/gui/gameover-overlay.js';

/**
 * The main class of the game, which handles its lifecycle
 */
export class BasketballGame extends ARDemo
{
    /**
     * Constructor
     */
    constructor()
    {
        super();

        this._assetManager = new AssetManager();
        this._eventQueue = new EventQueue();
        this._entities = [];
        this._gui = null;
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

        const imageTracker = AR.Tracker.Image();
        await imageTracker.database.add([
        {
            name: 'mage',
            image: document.getElementById('mage')
        }
        ]);

        const viewport = AR.Viewport({
            container: document.getElementById('ar-viewport'),
            hudContainer: document.getElementById('ar-hud')
        });

        const video = document.getElementById('my-video');
        const useWebcam = (video === null);
        const videoSource = useWebcam ? AR.Source.Camera() : AR.Source.Video(video);

        const pointerSource = AR.Source.Pointer();
        const pointerTracker = AR.Tracker.Pointer({
            space: 'adjusted'
        });

        const session = await AR.startSession({
            mode: 'immersive',
            viewport: viewport,
            trackers: [ imageTracker, pointerTracker ],
            sources: [ videoSource, pointerSource ],
            stats: true,
            gizmos: true,
        });

        const scan = document.getElementById('scan');

        imageTracker.addEventListener('targetfound', event => {
            session.gizmos.visible = false;
            if(scan)
                scan.hidden = true;

            this.broadcast(new GameEvent('targetfound'));
        });

        imageTracker.addEventListener('targetlost', event => {
            session.gizmos.visible = true;
            if(scan)
                scan.hidden = false;

            this.broadcast(new GameEvent('targetlost'));
        });

        return session;
    }

    /**
     * Preload resources before starting the AR session
     * @returns {Promise<void>}
     */
    preload()
    {
        console.log('Preloading assets...');

        return this._assetManager.preload(
            ASSET_LIST.map(asset => 'assets/' + asset),
            { timeout: 30 }
        );
    }

    /**
     * Initialization
     * @returns {Promise<void>}
     */
    init()
    {
        return Promise.resolve()
        .then(() => this._initPhysics())
        .then(() => this._initGUI())
        .then(() => this._spawnEntities())
        .then(() => this._flushEventQueue());
    }

    /**
     * Animation loop
     * @returns {void}
     */
    update()
    {
        for(let i = 0; i < this._entities.length; i++)
            this._entities[i].update();

        this._flushEventQueue();
    }

    /**
     * Release resources
     * @returns {void}
     */
    release()
    {
        for(let i = 0; i < this._entities.length; i++)
            this._entities[i].release();
    }

    /**
     * Asset Manager
     * @returns {AssetManager}
     */
    get assetManager()
    {
        return this._assetManager;
    }

    /**
     * A texture that supports 2D GUI elements. It acts as the root of the GUI
     * @returns {BABYLON.AdvancedDynamicTexture}
     */
    get gui()
    {
        return this._gui;
    }

    /**
     * Broadcast an event to all entities
     * @param {GameEvent} event
     * @returns {void}
     */
    broadcast(event)
    {
        this._eventQueue.enqueue(event);
    }

    /**
     * Instantiate an entity
     * @template {Entity} T
     * @param {new () => T} entityClass
     * @returns {Promise<T>}
     */
    spawn(entityClass)
    {
        const entity = Reflect.construct(entityClass, [ this ]);
        this._entities.push(entity);

        return Promise.resolve()
        .then(() => entity.init())
        .then(() => entity);
    }

    /**
     * Instantiate the entities of the game
     * @returns {Promise<void>}
     */
    _spawnEntities()
    {
        const wantNet = (location.search.indexOf('disablenet=1') < 0);

        return Promise.all([

            // main game elements
            this.spawn(GameController),
            this.spawn(Jukebox),
            this.spawn(Lights),
            this.spawn(Gravity),
            this.spawn(Ball),
            this.spawn(Goal),
            this.spawn(ScoreText).then(text => text.setScore(2)),
            this.spawn(ScoreText).then(text => text.setScore(3)),
            this.spawn(Scoreboard),
            wantNet && this.spawn(BasketballNet),

            // 2D GUI
            this.spawn(BallCounter),
            this.spawn(MuteButton),
            this.spawn(TutorialOverlay),
            this.spawn(GameOverOverlay),

        ]).then(() => void 0);
    }

    /**
     * Flush the event queue
     * @returns {void}
     */
    _flushEventQueue()
    {
        let event;

        // new events may be broadcasted during this loop
        while((event = this._eventQueue.dequeue())) {
            for(let i = 0; i < this._entities.length; i++)
                this._entities[i].handleEvent(event);
        }
    }

    /**
     * Initialize the physics plugin
     * @returns {void}
     */
    _initPhysics()
    {
        const physicsPlugin = new BABYLON.CannonJSPlugin();

        if(!this.ar.scene.enablePhysics(undefined, physicsPlugin))
            throw new Error(`Can't initialize the physics`);
    }

    /**
     * Initializes the GUI
     * @returns {void}
     */
    _initGUI()
    {
        this._gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

        this._scaleGUI = this._scaleGUI.bind(this);
        this._scaleGUI();

        const viewport = this.ar.session.viewport;
        viewport.addEventListener('resize', this._scaleGUI);
    }

    /**
     * Scale the GUI (fullscreen)
     * @returns {void}
     */
    _scaleGUI()
    {
        const idealHeightInLandscapeMode = 600;
        const viewport = this.ar.session.viewport;
        const aspectRatio = viewport.aspectRatio;
        let width, height;

        if(aspectRatio >= 1) {
            width = Math.round(idealHeightInLandscapeMode * aspectRatio);
            height = idealHeightInLandscapeMode;
        }
        else {
            width = idealHeightInLandscapeMode;
            height = Math.round(idealHeightInLandscapeMode / aspectRatio);
        }

        width -= width % 2;
        height -= height % 2;

        this._gui.scaleTo(width, height);

        const event = new GameEvent('guiresized');
        this.broadcast(event);
    }
}
