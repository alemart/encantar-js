/**
 * Magic AR Basketball Game
 * WebAR demo game of encantar.js
 *
 * @file Global definitions
 * @author Alexandre Martins
 * @license GPL-3.0-or-later
 */

/** Number of balls per match */
export const NUMBER_OF_BALLS = 5;

/** The minimum score for each rank */
export const RANK_TABLE = Object.freeze({
    'S':  15,
    'A+': 12,
    'A':  11,
    'B+': 8,
    'B':  5,
    'C':  2,
    'F':  0
});