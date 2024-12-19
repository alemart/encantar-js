/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview The Scoreboard
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { Entity, PhysicsEntity } from './entity.js';
import { GameEvent } from '../core/events.js';

/**
 * A digit of a Scoreboard
 */
class ScoreboardDigit extends Entity
{
     /**
     * Constructor
     * @param {BasketballGame} game
     */
    constructor(game)
    {
        super(game);
        this._mesh = null;
    }

    /**
     * Initialize the entity
     * @returns {void}
     */
    init()
    {
        this._mesh = this._createMesh();
        this.setDigit(Number.NaN);
    }

    /**
     * The mesh
     * @returns {BABYLON.Mesh}
     */
    get mesh()
    {
        return this._mesh;
    }

    /**
     * Set the digit to be displayed
     * @param {number} digit 0-9 or NaN
     * @returns {void}
     */
    setDigit(digit)
    {
        const uvs = new Array(8);

        uvs[0] = 1/8;
        uvs[1] = 6/8;
        uvs[2] = 0/8;
        uvs[3] = 6/8;
        uvs[4] = 0/8;
        uvs[5] = 8/8;
        uvs[6] = 1/8;
        uvs[7] = 8/8;

        if(digit == 0) {
            for(let i = 0; i < 8; i += 2) {
                uvs[i+0] += 4/8;
                uvs[i+1] -= 2/8;
            }
        }
        else if(digit >= 1 && digit <= 5) {
            for(let i = 0, d = digit; i < 8; i += 2) {
                uvs[i] += d/8;
            }
        }
        else if(digit >= 6 && digit <= 9) {
            for(let i = 0, d = digit-6; i < 8; i += 2) {
                uvs[i+0] += d/8;
                uvs[i+1] -= 2/8;
            }
        }

        this._mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
    }

    /**
     * Create the mesh
     * @returns {BABYLON.Mesh}
     */
    _createMesh()
    {
        const mesh = BABYLON.MeshBuilder.CreatePlane('ScoreboardDigit', {
            width: 0.5,
            height: 1.0,
        });

        const url = this._game.assetManager.url('atlas.png');
        const material = new BABYLON.StandardMaterial('ScoreboardDigitMaterial');

        material.diffuseTexture = new BABYLON.Texture(url);
        material.diffuseTexture.hasAlpha = true;
        material.useAlphaFromDiffuseTexture = true;
        material.unlit = true;
        //material.wireframe = true;

        mesh.material = material;
        mesh.rotate(BABYLON.Axis.Y, Math.PI);
        mesh.parent = this.ar.root;

        return mesh;
    }
}

/**
 * Scoreboard
 */
export class Scoreboard extends PhysicsEntity
{
     /**
     * Constructor
     * @param {BasketballGame} game
     */
    constructor(game)
    {
        super(game);
        this._mesh = null;
        this._units = null;
        this._tens = null;
    }

    /**
     * Initialize the entity
     * @returns {Promise<void>}
     */
    async init()
    {
        const x = 0.245, y = 0, z = 0.501;

        this._mesh = BABYLON.MeshBuilder.CreateBox('Scoreboard', {
            width: 1.3125,
            height: 1.0,
            depth: 1.0,
        });

        this._mesh.position = new BABYLON.Vector3(2.0, 0.4, 0.5);
        this._mesh.rotate(BABYLON.Axis.Y, -Math.PI / 6);

        this._mesh.material = new BABYLON.StandardMaterial('ScoreboardMaterial');
        this._mesh.material.diffuseColor = BABYLON.Color3.FromHexString('#110d7c');

        this._units = await this._game.spawn(ScoreboardDigit);
        this._units.mesh.position = new BABYLON.Vector3(x, y, z);
        this._units.mesh.parent = this._mesh;

        this._tens = await this._game.spawn(ScoreboardDigit);
        this._tens.mesh.position = new BABYLON.Vector3(-x, y, z);
        this._tens.mesh.parent = this._mesh;

        this._mesh.physicsImpostor = new BABYLON.PhysicsImpostor(this._mesh, BABYLON.PhysicsImpostor.BoxImpostor, {
            mass: 0,
        });

        this._mesh.parent = this.physicsAnchor;

        this._broadcast(new GameEvent('colliderready', { impostor: this._mesh.physicsImpostor }));
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
        if(event.type == 'newscore') {
            const score = event.detail.score;
            const units = score % 10;
            const tens = (score / 10) | 0;

            this._units.setDigit(units);
            this._tens.setDigit(tens || Number.NaN);
        }
    }
}