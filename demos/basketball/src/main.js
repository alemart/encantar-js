/**
 * Magic AR Basketball Game
 * WebAR demo game of encantar.js
 *
 * @file Main function
 * @author Alexandre Martins
 * @license GPL-3.0-or-later
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