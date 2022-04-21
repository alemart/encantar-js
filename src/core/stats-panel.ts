/*
 * MARTINS.js Free Edition
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022  Alexandre Martins <alemartf(at)gmail.com>
 * https://github.com/alemart/martins-js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * stats-panel.ts
 * Stats panel used for development purposes
 */

import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { Settings, PowerPreference } from './settings';
import { Tracker } from '../trackers/tracker';
import { Source } from '../sources/source';
import Martins from '../main';


/** Update interval, in ms */
const UPDATE_INTERVAL = 500;

/** Icons for different power profiles */
const POWER_ICON: { readonly [P in PowerPreference]: string } = Object.freeze({
    'default': '',
    'low-power': '<span style="color:#0f0">&#x1F50B</span>',
    'high-performance': '<span style="color:#ff0">&#x26A1</span>'
});



/**
 * Stats panel used for development purposes
 */
export class StatsPanel
{
    /** A container for the panel */
    private readonly _container: HTMLDivElement;

    /** Time of last update, in milliseconds */
    private _lastUpdate: DOMHighResTimeStamp;




    /**
     * Constructor
     * @param parent parent element of the panel
     */
    constructor(parent: HTMLElement)
    {
        this._container = this._createContainer(parent);
        this._lastUpdate = 0;
    }

    /**
     * Release the panel
     */
    release(): void
    {
        this._container.remove();
    }

    /**
     * A method to be called in the update loop
     * @param time current time in ms
     * @param trackers the trackers attached to the session
     * @param sources the sources of media linked to the session
     * @param gpu GPU cycles per second
     * @param fps frames per second
     */
    update(time: DOMHighResTimeStamp, trackers: Tracker[], sources: Source[], gpu: number, fps: number): void
    {
        if(time >= this._lastUpdate + UPDATE_INTERVAL) {
            this._lastUpdate = time;
            this._update(trackers, sources, fps, gpu);
        }
    }

    /**
     * Visibility of the panel
     */
    get visible(): boolean
    {
        return !this._container.hidden;
    }

    /**
     * Visibility of the panel
     */
    set visible(visible: boolean)
    {
        this._container.hidden = !visible;
    }

    /**
     * Update the contents of the panel
     * @param trackers the trackers attached to the session
     * @param sources the sources of media linked to the session
     * @param fps frames per second
     * @param gpu GPU cycles per second
     */
    private _update(trackers: Tracker[], sources: Source[], fps: number, gpu: number): void
    {
        const trackerStats = trackers.map(tracker => tracker._stats).join(', ');
        const sourceStats = sources.map(source => source._stats).join(', ');
        const param = { // sanitzed
            fps: this._colorize(fps),
            gpu: this._colorize(gpu),
            powerIcon: POWER_ICON[Settings.powerPreference]
        };

        this._container.textContent = (
            `MARTINS.js ${Martins.edition}
            Version ${Martins.version}
            FPS: [fps] | GPU: [gpu] [powerIcon]
            IN : ${sourceStats}
            OUT: ${trackerStats}`
        );

        const fn = (_: string, x: 'fps' | 'gpu' | 'powerIcon'): string => param[x];
        this._container.innerHTML = this._container.innerHTML.replace(/\[(\w+)\]/g, fn);
    }

    /**
     * Colorize a frequency number
     * @param f frequency given in cycles per second
     * @returns colorized number (HTML)
     */
    private _colorize(f: number): string
    {
        const GREEN = '#0f0', YELLOW = '#ff0', RED = '#f33';
        const color3 = f >= 50 ? GREEN : (f >= 30 ? YELLOW : RED);
        const color2 = f >= 30 ? GREEN : RED;
        const color = Settings.powerPreference != 'low-power' ? color3 : color2;

        return `<span style="color:${color}">${Number(f)}</span>`;
    }

    /**
     * Create the container for the panel
     * @param parent parent element
     * @returns a container
     */
    private _createContainer(parent: HTMLElement): HTMLDivElement
    {
        const container = document.createElement('div') as HTMLDivElement;

        container.style.position = 'absolute';
        container.style.left = container.style.top = '0px';
        container.style.zIndex = '1000000';
        container.style.padding = '4px';
        container.style.whiteSpace = 'pre-line';
        container.style.backgroundColor = 'rgba(0,0,0,0.5)';
        container.style.color = '#fff';
        container.style.fontFamily = 'monospace';
        container.style.fontSize = '14px';

        parent.appendChild(container);
        return container;
    }
}