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
     * @param {BasketballDemo} demo
     */
    constructor(demo)
    {
        super(demo);
        this._sound = new Map();
    }

    /**
     * Initialize the entity
     * @returns {void}
     */
    init()
    {
        const soundFiles = ASSET_LIST.filter(asset => asset.endsWith('.wav'));

        for(const filepath of soundFiles) {
            const url = this._demo.assetManager.url(filepath);
            const soundName = filepath.substring(0, filepath.length - 4);
            const sound = new BABYLON.Sound(soundName, url);

            this._sound.set(soundName, sound);
        }

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
                this._play('net', event.detail.position);
                if(event.detail.score == 3)
                    this._play('bonus');
                break;

            case 'gameover':
                if(/^[AS]/.test(event.detail.rank))
                    this._play('win');
                else if(event.detail.rank == 'B+')
                    this._play('bonus');
                else
                    this._play('lose');
                break;

            case 'ballbounced':
                if(event.detail.material == 'backboard')
                    this._play('backboard', event.detail.position);
                else
                    this._play('bounce', event.detail.position);
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