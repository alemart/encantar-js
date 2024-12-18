/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview Main function
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { BasketballGame } from './core/game.js';

/**
 * Start the game
 * @returns {void}
 */
function main()
{
    const game = new BasketballGame();

    if(typeof encantar === 'undefined')
        throw new Error(`Can't find the babylon.js plugin for encantar.js`);

    encantar(game).catch(error => {
        alert(error.message);
    });
}

document.addEventListener('DOMContentLoaded', main);