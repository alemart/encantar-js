/*
 * MARTINS.js
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
 * stats-panel.ts
 * Stats panel used for development purposes
 */

import { SpeedySize } from 'speedy-vision/types/core/speedy-size';
import { Settings, PowerPreference } from './settings';
import { Viewport } from './viewport';
import { Tracker } from '../trackers/tracker';
import { Source } from '../sources/source';
import { Utils, Nullable } from '../utils/utils';
import Martins from '../main';


/** Update interval, in ms */
const UPDATE_INTERVAL = 500;

/** Icons for different power profiles */
const POWER_ICON: { readonly [P in PowerPreference]: string } = Object.freeze({
    'default': '',
    'low-power': '&#x1F50B',
    'high-performance': '&#x26A1'
});



/**
 * Stats panel used for development purposes
 */
export class StatsPanel
{
    /** The viewport associated to this panel */
    private readonly _viewport: Viewport;

    /** A container for the panel */
    private readonly _container: HTMLDivElement;

    /** Time of last update, in milliseconds */
    private _lastUpdate: DOMHighResTimeStamp;




    /**
     * Constructor
     * @param parent parent element of the panel
     */
    constructor(viewport: Viewport)
    {
        this._viewport = viewport;
        this._lastUpdate = 0;

        this._container = this._createContainer();
        viewport.hud.container.appendChild(this._container);
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
        // all sanitized
        const lfps = this._label('_ar_fps');
        if(lfps !== null) {
            lfps.style.color = this._color(fps);
            lfps.innerText = String(fps);
        }

        const lgpu = this._label('_ar_gpu');
        if(lgpu !== null) {
            lgpu.style.color = this._color(gpu);
            lgpu.innerText = String(gpu);
        }

        const lpower = this._label('_ar_power');
        if(lpower !== null)
            lpower.innerHTML = POWER_ICON[Settings.powerPreference];

        const lin = this._label('_ar_in');
        if(lin !== null) {
            const sourceStats = sources.map(source => source._stats).join(', ');
            lin.innerText = sourceStats;
        }

        const lout = this._label('_ar_out');
        if(lout !== null) {
            const trackerStats = trackers.map(tracker => tracker._stats).join(', ');
            lout.innerText = trackerStats;
        }
    }

    /**
     * Get a label of the panel
     * @param className
     * @returns the HTML element, or null if it doesn't exist
     */
    private _label(className: string): Nullable<HTMLElement>
    {
        return this._container.getElementsByClassName(className).item(0) as Nullable<HTMLElement>;
    }

    /**
     * Associate a color to a frequency number
     * @param f frequency given in cycles per second
     * @returns colorized number (HTML)
     */
    private _color(f: number): string
    {
        const GREEN = '#0f0', YELLOW = '#ff0', RED = '#f33';
        const color3 = f >= 50 ? GREEN : (f >= 30 ? YELLOW : RED);
        const color2 = f >= 30 ? GREEN : RED;
        const color = Settings.powerPreference != 'low-power' ? color3 : color2;

        return color;
    }

    /**
     * Create the container for the panel
     * @returns a container
     */
    private _createContainer(): HTMLDivElement
    {
        const container = document.createElement('div') as HTMLDivElement;
        const print = (html: string) => container.insertAdjacentHTML('beforeend', html);

        container.style.position = 'absolute';
        container.style.left = container.style.top = '0px';
        container.style.zIndex = '1000000';
        container.style.padding = '4px';
        container.style.whiteSpace = 'pre-line';
        container.style.backgroundColor = 'rgba(0,0,0,0.5)';
        container.style.color = 'white';
        container.style.fontFamily = 'monospace';
        container.style.fontSize = '14px';

        // all sanitized
        container.innerText = 'MARTINS.js ' + Martins.version;

        print('<br>');
        print('FPS: <span class="_ar_fps"></span> | ');
        print('GPU: <span class="_ar_gpu"></span> ');
        print('<span class="_ar_power"></span>');

        print('<br>');
        print('IN: <span class="_ar_in"></span>');

        print('<br>');
        print('OUT: <span class="_ar_out"></span>');

        if(this._viewport.fullscreenAvailable) {
            print('<br>');
            container.appendChild(this._createFullscreenToggle());
        }

        return container;
    }

    /**
     * Create a fullscreen toggle
     * @returns a fullscreen toggle
     */
    private _createFullscreenToggle(): HTMLElement
    {
        const toggle = document.createElement('a') as HTMLAnchorElement;

        Utils.assert(this._viewport != null);

        toggle.href = 'javascript:void(0)';
        toggle.innerText = 'Toggle fullscreen';
        toggle.style.color = 'white';
        toggle.setAttribute('role', 'button');
        toggle.addEventListener('click', () => {
            if(!this._viewport.fullscreen) {
                this._viewport.requestFullscreen().catch(err => {
                    alert(`Can't enable fullscreen mode. ` + err.toString());
                });
            }
            else {
                this._viewport.exitFullscreen();
            }
        });

        return toggle;
    }
}