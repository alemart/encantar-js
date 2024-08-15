/*
 * encantar.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022-2024 Alexandre Martins <alemartf(at)gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * asap.ts
 * Schedule a function to run "as soon as possible"
 */

/** callbacks */
const callbacks: Function[] = [];

/** arguments to be passed to the callbacks */
const args: any[][] = [];

/** asap key */
const ASAP_KEY = 'asap' + Math.random().toString(36).substr(1);

// Register an event listener
window.addEventListener('message', event => {
    if(event.source !== window || event.data !== ASAP_KEY)
        return;

    event.stopPropagation();
    if(callbacks.length == 0)
        return;

    const fn = callbacks.pop() as Function;
    const argArray = args.pop() as any[];
    fn.apply(undefined, argArray);
}, true);

/**
 * Schedule a function to run "as soon as possible"
 * @param fn callback
 * @param params optional parameters
 */
export function asap(fn: Function, ...params: any[]): void
{
    callbacks.unshift(fn);
    args.unshift(params);
    window.postMessage(ASAP_KEY, '*');
}