/**
 * Magic AR Basketball Game
 * WebAR demo game of encantar.js
 *
 * @file Event queue
 * @author Alexandre Martins
 * @license GPL-3.0-or-later
 */

import { GameEvent } from './events.js';

/**
 * Event queue
 */
export class EventQueue
{
    /**
     * Constructor
     */
    constructor()
    {
        this._events = /** @type {GameEvent[]} */ ( [] );
    }

    /**
     * Enqueue an event
     * @param {GameEvent} event
     * @returns {void}
     */
    enqueue(event)
    {
        this._events.push(event);
    }

    /**
     * Removes and returns the first event from the queue
     * If the queue is empty, null is returned instead
     * @returns {GameEvent|null}
     */
    dequeue()
    {
        return this._events.shift() || null;
    }
}