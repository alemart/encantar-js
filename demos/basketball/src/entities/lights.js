/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview The lights of the virtual scene
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { Entity } from './entity.js';

/**
 * The lights of the virtual scene
 */
export class Lights extends Entity
{
    /**
     * Initialize the entity
     * @returns {void}
     */
    init()
    {
        const light = new BABYLON.HemisphericLight('light', BABYLON.Vector3.Up());
        const dlight = new BABYLON.DirectionalLight('dlight', BABYLON.Vector3.Down());

        light.intensity = 1.0;
        light.diffuse = new BABYLON.Color3(1, 1, 1);
        light.groundColor = new BABYLON.Color3(1, 1, 1);
        light.specular = new BABYLON.Color3(0, 0, 0);

        dlight.intensity = 1.0;
        dlight.diffuse = new BABYLON.Color3(1, 1, 1);
        dlight.specular = new BABYLON.Color3(1, 1, 1);

        const ar = this.ar;
        dlight.parent = ar.root;
    }
}
