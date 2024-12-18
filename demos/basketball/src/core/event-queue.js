/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview Event queue
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
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