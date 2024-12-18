/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview A class for game events
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

/**
 * Game Event
 */
export class GameEvent extends CustomEvent
{
    /**
     * Constructor
     * @param {string} type
     * @param {any} [detail]
     */
    constructor(type, detail)
    {
        super(type, { detail });
    }
}
