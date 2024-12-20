/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview Ball Counter - 2D Graphical User Interface (GUI)
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { GUIControl } from './gui-control.js';
import { Entity } from '../entity.js';
import { NUMBER_OF_BALLS } from '../../core/globals.js';

/**
 * Ball Icon
 */
class BallIcon extends GUIControl
{
    /**
     * Create the control
     * @returns {BABYLON.GUI.Control}
     */
    _createControl()
    {
        const url = this._game.assetManager.url('atlas.png');
        const icon = new BABYLON.GUI.Image('ballIcon', url);

        icon.sourceLeft = 896;
        icon.sourceTop = 0;
        icon.sourceWidth = 128;
        icon.sourceHeight = 128;

        icon.width = '48px';
        icon.height = '48px';

        icon.left = 8;
        icon.top = 0;
        icon.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        icon.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        icon.notRenderable = true;

        return icon;
    }

    /**
     * Reposition the icon
     * @param {number} yOffset
     * @returns {void}
     */
    _repositionBy(yOffset)
    {
        const icon = this.control;
        const size = parseInt(icon.height);

        icon.top = yOffset * size;
    }

    /**
     * Set the ID of the icon
     * @param {number} id
     * @returns {this}
     */
    setId(id)
    {
        const j = (NUMBER_OF_BALLS / 2) | 0;

        this._id = id;
        this._repositionBy((id - j) * 1.125);

        return this;
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
        switch(event.type) {
            case 'targetfound':
                this.control.isVisible = true;
                break;

            case 'targetlost':
                this.control.isVisible = false;
                break;

            case 'newball':
                this.control.notRenderable = !(this._id < event.detail.ballsLeft);
                break;
        }
    }
}

/**
 * Ball Counter
 */
export class BallCounter extends Entity
{
    /**
     * Initialize the entity
     * @returns {Promise<void>}
     */
    init()
    {
        const icons = [];

        for(let i = 0; i < NUMBER_OF_BALLS; i++) {
            const icon = this._game.spawn(BallIcon).then(icon => icon.setId(i));
            icons.push(icon);
        }

        return Promise.all(icons).then(() => void 0);
    }
}
