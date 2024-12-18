/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview The Game Controller manages the state of the game
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { Entity } from './entity.js';
import { GameEvent } from '../core/events.js';
import { NUMBER_OF_BALLS, SCORE_TABLE } from '../core/globals.js';

/**
 * The Game Controller manages the state of the game
 */
export class GameController extends Entity
{
    /**
     * Constructor
     * @param {BasketballDemo} demo
     */
    constructor(demo)
    {
        super(demo);

        this._ballsLeft = NUMBER_OF_BALLS;
        this._score = 0;
    }

    /**
     * Initialize the entity
     * @returns {void}
     */
    init()
    {
        this._broadcast(new GameEvent('newball', { ballsLeft: this._ballsLeft }));
        this._broadcast(new GameEvent('newscore', { score: this._score }));
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
        switch(event.type) {
            case 'scored':
                this._score += event.detail.score;
                this._broadcast(new GameEvent('newscore', { score: this._score }));
                break;

            case 'lostball':
                if(--this._ballsLeft <= 0) {
                    const rank = this._computeRank(this._score);
                    this._broadcast(new GameEvent('newball', { ballsLeft: 0 }));
                    this._broadcast(new GameEvent('gameover', { rank }));
                }
                else
                    this._broadcast(new GameEvent('newball', { ballsLeft: this._ballsLeft }));
                break;

            case 'restarted':
                this._score = 0;
                this._ballsLeft = NUMBER_OF_BALLS;
                this._broadcast(new GameEvent('newscore', { score: this._score }));
                this._broadcast(new GameEvent('newball', { ballsLeft: this._ballsLeft }));
                break;

            case 'targetlost':
                this._broadcast(new GameEvent('restarted'));
                break;
        }
    }

    /**
     * Compute the rank based on the score of the player
     * @param {number} score
     * @returns {string}
     */
    _computeRank(score)
    {
        const entries = Object.entries(SCORE_TABLE).sort((a, b) => b[1] - a[1]);

        for(const [rank, minScore] of entries) {
            if(score >= minScore)
                return rank;
        }

        return '?';
    }
}
