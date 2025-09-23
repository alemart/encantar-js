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
        this._audioEngine = null;
        this._sound = new Map();
        this._music = null;
    }

    /**
     * Initialize the entity
     * @returns {Promise<void>}
     */
    async init()
    {
        this._audioEngine = await BABYLON.CreateAudioEngineAsync({
            disableDefaultUI: true,
        });

        await this._loadSounds();
        await this._loadMusic();

        this._audioEngine.listener.attach(this.ar.scene.activeCamera);
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
                if(!this._isPlaying(this._music))
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

            case 'awakened':
                this._audioEngine.unlockAsync();
                break;
        }
    }

    /**
     * Load the sound effects
     * @returns {Promise<void>}
     */
    async _loadSounds()
    {
        const soundFiles = ASSET_LIST.filter(asset => asset.endsWith('.wav'));

        for(const filepath of soundFiles) {
            const url = this._game.assetManager.url(filepath);
            const soundName = filepath.substring(0, filepath.length - 4);
            const sound = await BABYLON.CreateSoundAsync(soundName, url);

            this._sound.set(soundName, sound);
        }
    }

    /**
     * Load the music
     * @returns {Promise<void>}
     */
    async _loadMusic()
    {
        const url = this._game.assetManager.url('music.mp3');
        this._music = await BABYLON.CreateSoundAsync('music', url, {
            maxInstances: 1,
            loop: true
        });
    }

    /**
     * Check if a sound is playing
     * @param {BABYLON.StaticSound} sound
     * @returns {boolean}
     */
    _isPlaying(sound)
    {
        return sound && (
            sound.state == BABYLON.SoundState.Starting ||
            sound.state == BABYLON.SoundState.Started
        );
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

        /*
        // spatial audio
        if(position !== null)
            sfx.spatial.position.copyFrom(position);
        */

        sfx.play();
    }

    /**
     * Mute the game
     * @returns {void}
     */
    _mute()
    {
        this._audioEngine.setVolume(0.0);
    }

    /**
     * Unmute the game
     * @returns {void}
     */
    _unmute()
    {
        this._audioEngine.setVolume(1.0);
    }
}