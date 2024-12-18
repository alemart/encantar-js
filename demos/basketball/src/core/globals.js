/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview Global definitions
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
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