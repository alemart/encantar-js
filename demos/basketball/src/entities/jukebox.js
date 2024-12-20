/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview An entity that plays sounds
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { Entity } from './entity.js';
import { GameEvent } from '../core/events.js';
import { ASSET_LIST } from '../core/asset-list.js';

/**
 * An entity that plays sounds
 */
export class Jukebox extends Entity
{
     /**
     * Constructor
     * @param {BasketballGame} game
     */
    constructor(game)
    {
        super(game);
        this._sound = new Map();
        this._music = null;
    }

    /**
     * Initialize the entity
     * @returns {void}
     */
    init()
    {
        this._loadSounds();
        this._loadMusic();
        BABYLON.Engine.audioEngine.useCustomUnlockedButton = true;
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
        switch(event.type) {
            case 'scored':
                this._play('basket', event.detail.position);
                if(event.detail.score == 3)
                    this._play('bonus');
                break;

            case 'ballbounced':
                if(event.detail.material == 'backboard')
                    this._play('backboard', event.detail.position);
                else
                    this._play('bounce', event.detail.position);
                break;

            case 'gameover':
                this._music.setVolume(0.2);
                if(/^[AS]/.test(event.detail.rank))
                    this._play('win');
                else if(event.detail.rank == 'B+')
                    this._play('bonus');
                else
                    this._play('lose');
                break;

            case 'started':
            case 'restarted':
                this._music.setVolume(0.5);
                if(!this._music.isPlaying)
                    this._music.play();
                break;

            case 'paused':
                this._music.stop();
                break;

            case 'unmuted':
                this._unmute();
                this._play('button');
                break;

            case 'muted':
                this._mute();
                break;
        }
    }

    /**
     * Load the sound effects
     * @returns {void}
     */
    _loadSounds()
    {
        const soundFiles = ASSET_LIST.filter(asset => asset.endsWith('.wav'));

        for(const filepath of soundFiles) {
            const url = this._game.assetManager.url(filepath);
            const soundName = filepath.substring(0, filepath.length - 4);
            const sound = new BABYLON.Sound(soundName, url);

            this._sound.set(soundName, sound);
        }
    }

    /**
     * Load the music
     * @returns {void}
     */
    _loadMusic()
    {
        const url = this._game.assetManager.url('music.mp3');
        this._music = new BABYLON.Sound('music', url, this.ar.scene, null, { loop: true });
    }

    /**
     * Play a sound
     * @param {string} soundName
     * @param {BABYLON.Vector3|null} [position]
     * @returns {void}
     */
    _play(soundName, position = null)
    {
        const sfx = this._sound.get(soundName);
        if(!sfx)
            return;

        if(!BABYLON.Engine.audioEngine.unlocked)
            BABYLON.Engine.audioEngine.unlock();

        if(position !== null) {
            sfx.spatialSound = true;
            sfx.setPosition(position);
        }
        else
            sfx.spatialSound = false;

        sfx.play();
    }

    /**
     * Mute the game
     * @returns {void}
     */
    _mute()
    {
        BABYLON.Engine.audioEngine.setGlobalVolume(0.0);
    }

    /**
     * Unmute the game
     * @returns {void}
     */
    _unmute()
    {
        BABYLON.Engine.audioEngine.setGlobalVolume(1.0);
    }
}