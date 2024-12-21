/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview An overlay that shows how to play the game - 2D Graphical User Interface (GUI)
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { GUIControl } from './gui-control.js';
import { GameEvent } from '../../core/events.js';

/** Duration of the swipe animation, in seconds */
const ANIMATION_DURATION = 1.5;

/**
 * An overlay that shows how to play the game
 */
export class TutorialOverlay extends GUIControl
{
    /**
     * Constructor
     * @param {BasketballGame} game
     */
    constructor(game)
    {
        super(game);
        this._timer = 0;
    }

    /**
     * Create the control
     * @returns {BABYLON.GUI.Control}
     */
    _createControl()
    {
        const url = this._game.assetManager.url('atlas.png');
        const container = new BABYLON.GUI.Container();
        const text = new BABYLON.GUI.TextBlock();
        const hand = new BABYLON.GUI.Image('hand', url);

        container.background = 'rgba(51, 51, 76, 0.75)';
        container.zIndex = 1;

        text.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        text.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        text.text = 'Swipe to\nshoot';
        text.color = 'white';
        text.fontFamily = 'sans-serif';
        text.fontStyle = 'bold';
        text.fontSize = 96;
        text.top = '0%';
        text.left = 0;
        text.zIndex = 1;
        container.addControl(text);

        hand.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        hand.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        hand.stretch = BABYLON.GUI.Image.STRETCH_NONE;
        hand.sourceLeft = 768;
        hand.sourceTop = 256;
        hand.sourceWidth = 256;
        hand.sourceHeight = 256;
        hand.width = '384px';
        hand.height = '384px';
        hand.top = '-50%';
        container.addControl(hand);

        return container;
    }

    /**
     * Update the entity
     * @returns {void}
     */
    update()
    {
        const ar = this.ar;
        const container = this.control;

        // check if the tutorial is being displayed
        if(!container.isVisible)
            return;

        // hide the overlay when touching the screen
        if(ar.pointers.length > 0) {
            const pointer = ar.pointers[0];
            if(pointer.phase == 'began') {
                this._dismiss();
                return;
            }
        }

        // advance the timer
        const dt = ar.session.time.delta;
        this._timer += dt / ANIMATION_DURATION;
        this._timer -= Math.floor(this._timer);

        // tweening
        const t = this._ease(this._timer);
        const top = -40 * t - 10;
        const hand = container.getChildByName('hand');
        if(hand)
            hand.top = top + '%';
    }

    /**
     * Easing function
     * @param {number} t in [0,1]
     * @returns {number} f(t) in [0,1]
     */
    _ease(t)
    {
        return 0.5 - 0.5 * Math.cos(Math.PI * t);
    }

    /**
     * Dismiss the tutorial
     * @returns {void}
     */
    _dismiss()
    {
        if(!this.control.isVisible)
            return;

        this.control.isVisible = false;
        this._broadcast(new GameEvent('tutorialdismissed'));
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
        switch(event.type) {
            case 'awakened':
                this.control.isVisible = true;
                break;

            case 'slept':
                this.control.isVisible = false;
                break;

            case 'guiresized':
                this.control.markAllAsDirty();
                break;
        }
    }
}