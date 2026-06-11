/**
 * Magic AR Basketball Game
 * WebAR demo game of encantar.js
 *
 * @file A class for game events
 * @author Alexandre Martins
 * @license GPL-3.0-or-later
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
