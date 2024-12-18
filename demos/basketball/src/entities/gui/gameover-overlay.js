/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview An overlay displayed at the end of a match - 2D Graphical User Interface (GUI)
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { GUIControl } from './gui-control.js';
import { GameEvent } from '../../core/events.js';

/**
 * An overlay displayed at the end of a match
 */
export class GameOverOverlay extends GUIControl
{
    /**
     * Constructor
     * @param {BasketballGame} game
     */
    constructor(game)
    {
        super(game);

        this._messages = {
            'S' : 'YOU ARE A\nLEGEND!!!!!',
            'A+': 'Well done!\nYou\'re a Pro!',
            'A' : 'Well done!\nYou\'re a Pro!',
            'B+': 'Nice, but you\'re\nnot yet a Pro!',
            'B' : 'You can do better!',
            'C' : 'Try again!',
            'F' : 'Try again!'
        };
    }

    /**
     * Create the control
     * @returns {BABYLON.GUI.Control}
     */
    _createControl()
    {
        const container = new BABYLON.GUI.Container();
        const title = new BABYLON.GUI.TextBlock();
        const rank = new BABYLON.GUI.TextBlock('rank');
        const message = new BABYLON.GUI.TextBlock('message');
        const circle = new BABYLON.GUI.Ellipse();

        container.background = 'rgba(51, 51, 76, 0.75)';
        container.zIndex = 1;

        title.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        title.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        title.text = 'Rank';
        title.color = 'white';
        title.fontFamily = 'sans-serif';
        title.fontStyle = 'bold';
        title.fontSize = 80;
        title.top = '-192px';
        title.left = '0px';
        container.addControl(title);

        rank.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        rank.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        rank.text = '';
        rank.color = 'white';
        rank.fontFamily = 'sans-serif';
        rank.fontStyle = 'bold';
        rank.fontSize = 112;
        container.addControl(rank);

        circle.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        circle.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        circle.width = '192px';
        circle.height = circle.width;
        circle.color = 'white';
        circle.thickness = 16;
        container.addControl(circle);

        message.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        message.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        message.text = '';
        message.textWrapping = true;
        message.color = 'white';
        message.fontFamily = 'sans-serif';
        message.fontSize = 56;
        message.top = '192px';
        message.left = '0px';
        message.paddingLeft = '10%';
        message.paddingRight = '10%';
        container.addControl(message);

        return container;
    }

    /**
     * Update the entity
     * @returns {void}
     */
    update()
    {
        const container = this.control;
        if(!container.isVisible)
            return;

        const ar = this.ar;
        if(ar.pointers.length == 0)
            return;

        const pointer = ar.pointers[0];
        if(pointer.phase != 'began')
            return;

        // hide the overlay when touching the screen
        container.isVisible = false;
        this._broadcast(new GameEvent('restarted'));
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
        if(event.type == 'gameover') {
            const container = this.control;
            const rank = container.getChildByName('rank');
            const message = container.getChildByName('message');

            rank.text = event.detail.rank;
            message.text = this._messages[event.detail.rank] || '';

            container.isVisible = true;
        }
        else if(event.type == 'targetlost')
            this.control.isVisible = false;
    }
}