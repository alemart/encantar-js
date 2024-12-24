/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview Score Text
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { Entity } from './entity.js';
import { GameEvent } from '../core/events.js';

/** Movement length, in world units */
const MOVEMENT_LENGTH = 0.5;

/** Duration of the animation, in seconds */
const ANIMATION_DURATION = 3.0;

/** Duration of the fade-out effect, in seconds */
const FADE_OUT_DURATION = 1.0;

/** Y offset from the hoop, in world units */
const Y_OFFSET = 0.25;

/**
 * Score Text
 */
export class ScoreText extends Entity
{
     /**
     * Constructor
     * @param {BasketballGame} game
     */
    constructor(game)
    {
        super(game);
        this._score = 0;
        this._mesh = null;
        this._initialPosition = new BABYLON.Vector3();
        this._timer = 0;
    }

    /**
     * Initialize the entity
     * @returns {void}
     */
    init()
    {
        const mesh = BABYLON.MeshBuilder.CreatePlane('ScoreText', {
            width: 0.5,
            height: 0.5,
        });

        const url = this._game.assetManager.url('atlas.png');
        const material = new BABYLON.StandardMaterial('ScoreTextMaterial');

        material.diffuseTexture = new BABYLON.Texture(url);
        material.diffuseTexture.hasAlpha = true;
        material.useAlphaFromDiffuseTexture = true;
        material.frontUVs = BABYLON.Vector4.Zero();
        material.alpha = 0;
        material.unlit = true;

        const ar = this.ar;
        mesh.parent = ar.root;
        mesh.material = material;
        mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        this._mesh = mesh;
    }

    /**
     * Update the entity
     * @returns {void}
     */
    update()
    {
        const mesh = this._mesh;

        if(this._timer <= 0) {
            mesh.material.alpha = 0;
            return;
        }

        const ar = this.ar;
        const dt = ar.session.time.delta;
        this._timer -= dt;

        const speed = MOVEMENT_LENGTH / ANIMATION_DURATION;
        mesh.position.y += speed * dt;

        if(this._timer < FADE_OUT_DURATION) {
            const rate = 1.0 / FADE_OUT_DURATION;
            mesh.material.alpha -= rate * dt;
        }
    }

    /**
     * Set the score to be displayed
     * @param {number} score
     * @returns {this}
     */
    setScore(score)
    {
        const uvs = new Array(8).fill(0);
        const d = 1 / 1024;

        if(score == 2) {
            uvs[0] = 7/8;
            uvs[1] = 6/8;
            uvs[2] = 6/8 + d;
            uvs[3] = 6/8;
            uvs[4] = 6/8 + d;
            uvs[5] = 7/8 - d;
            uvs[6] = 7/8;
            uvs[7] = 7/8 - d;
        }
        else if(score == 3) {
            uvs[0] = 8/8 - d;
            uvs[1] = 6/8;
            uvs[2] = 7/8;
            uvs[3] = 6/8;
            uvs[4] = 7/8;
            uvs[5] = 7/8 - d;
            uvs[6] = 8/8 - d;
            uvs[7] = 7/8 - d;
        }

        this._mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
        this._score = score;
        return this;
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
        if(event.type == 'hoopready') {
            const hoopPosition = event.detail.position;
            const offset = new BABYLON.Vector3(0, Y_OFFSET, 0);
            const position = hoopPosition.add(offset);

            this._initialPosition.copyFrom(position);
            this._mesh.position.copyFrom(this._initialPosition);
        }
        else if(event.type == 'scored') {
            const score = event.detail.score;

            if(score == this._score) {
                this._mesh.material.alpha = 1;
                this._mesh.position.copyFrom(this._initialPosition);
                this._timer = ANIMATION_DURATION;
            }
        }
        else if(event.type == 'paused')
            this._mesh.material.alpha = 0;
    }
}
