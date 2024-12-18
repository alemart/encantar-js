/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview The Basketball Goal
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { PhysicsEntity } from './entity.js';
import { GameEvent } from '../core/events.js';

/** Offset from ar.root in the local y-axis */
const Y_OFFSET = -0.35;

/**
 * The Basketball Goal
 */
export class Goal extends PhysicsEntity
{
    /**
     * Constructor
     * @param {BasketballDemo} demo
     */
    constructor(demo)
    {
        super(demo);
        this._physicsRoot = null;
    }

    /**
     * Initialize the entity
     * @returns {Promise<void>}
     */
    async init()
    {
        const file = this._demo.assetManager.file('goal.glb');
        const gltf = await BABYLON.SceneLoader.ImportMeshAsync('', '', file);
        this._physicsRoot = this._createPhysicsRoot(gltf.meshes);
        this._physicsRoot.position.y = Y_OFFSET;
    }

    /**
     * Create a root node with a physics impostor
     * @param {BABYLON.Mesh[]} meshes from gltf
     * @returns {BABYLON.Mesh}
     */
    _createPhysicsRoot(meshes)
    {
        const physicsRoot = new BABYLON.Mesh('Goal');
        const hooks = [];

        meshes.forEach(mesh => {
            if(mesh.name.startsWith('Collider_') || mesh.name.startsWith('Trigger_') || mesh.name.startsWith('Hook_')) {
                mesh.isVisible = false;
                physicsRoot.addChild(mesh);
            }
        });

        meshes.forEach(mesh => {
            if(mesh.parent == null)
                physicsRoot.addChild(mesh);
        });

        physicsRoot.getChildMeshes().forEach(mesh => {
            if(mesh.name.startsWith('Collider_')) {
                mesh.scaling.x = Math.abs(mesh.scaling.x);
                mesh.scaling.y = Math.abs(mesh.scaling.y);
                mesh.scaling.z = Math.abs(mesh.scaling.z);

                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, {
                    mass: 0,
                });
            }
            else if(mesh.name.startsWith('Trigger_'))
                this._broadcast(new GameEvent('triggerready', { mesh }));
            else if(mesh.name.startsWith('Hook_'))
                hooks.push(mesh);
        });

        hooks.sort((a, b) => a.name.localeCompare(b.name));
        this._broadcast(new GameEvent('hooksready', { hooks }));

        physicsRoot.physicsImpostor = new BABYLON.PhysicsImpostor(physicsRoot, BABYLON.PhysicsImpostor.NoImpostor, {
            mass: 0
        });

        physicsRoot.parent = this.physicsAnchor;

        this._broadcast(new GameEvent('colliderready', { impostor: physicsRoot.physicsImpostor }));
        return physicsRoot;
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
        if(event.type == 'netready') {
            const net = event.detail.entity;
            net.moveBy(this._physicsRoot.position);
        }
    }
}
