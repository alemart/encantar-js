/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview Gravity of the virtual scene
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { Entity } from './entity.js';

/** The magnitude of the gravity vector in world units per second squared */
const MAGNITUDE = 9.81;

/**
 * This entity updates the direction of gravity based on AR tracking results
 */
export class Gravity extends Entity
{
    /**
     * Constructor
     * @param {BasketballGame} game
     */
    constructor(game)
    {
        super(game);
        this._gravity = new BABYLON.Vector3();
        this._isTracking = false;
    }

    /**
     * Update gravity
     * @returns {void}
     */
    update()
    {
        const ar = this.ar;

        // calculate the gravity vector in world space
        if(this._isTracking) {
            // we assume that the target image is parallel to a wall,
            // because basketball boards are perpendicular to the ground
            this._gravity.copyFrom(ar.root.up).scaleInPlace(-MAGNITUDE);
        }
        else {
            // use a default gravity vector
            this._gravity.set(0, -MAGNITUDE, 0);
        }

        ar.scene.getPhysicsEngine().setGravity(this._gravity);
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
        if(event.type == 'targetfound')
            this._isTracking = true;
        else if(event.type == 'targetlost')
            this._isTracking = false;
    }
}