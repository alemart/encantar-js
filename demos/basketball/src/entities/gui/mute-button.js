/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview Mute/Unmute button - 2D Graphical User Interface (GUI)
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { GUIControl } from './gui-control.js';
import { GameEvent } from '../../core/events.js';
import { NUMBER_OF_BALLS } from '../../core/globals.js';

/**
 * Mute/Unmute button
 */
export class MuteButton extends GUIControl
{
    /**
     * Create the control
     * @returns {BABYLON.GUI.Control}
     */
    _createControl()
    {
        const url = this._game.assetManager.url('atlas.png');
        const button = BABYLON.GUI.Button.CreateImageOnlyButton('muteButton', url);
        const offset = 1.5 + ((NUMBER_OF_BALLS / 2) | 0);

        button.image.sourceLeft = 640;
        button.image.sourceTop = 256;
        button.image.sourceWidth = 128;
        button.image.sourceHeight = 128;

        button.width = '48px';
        button.height = '48px';

        button.left = 8;
        button.top = -offset * 48 * 1.125;
        button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        button.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        button.onPointerClickObservable.add(this._onClick.bind(this));
        button.alpha = 0.75;

        return button;
    }

    /**
     * Click handler
     * @returns {void}
     */
    _onClick()
    {
        const button = this.control;
        const wasMuted = (button.image.sourceTop != 256);
        const isMuted = !wasMuted;

        button.image.sourceTop = !isMuted ? 256 : 384;

        this._broadcast(new GameEvent(isMuted ? 'muted' : 'unmuted'));
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
        }
    }
}