/*
 * encantar.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022-2026 Alexandre Martins <alemartf(at)gmail.com>
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
import { Settings, PowerPreference } from '../core/settings';
import { Viewport } from '../core/viewport';
import { Tracker } from '../trackers/tracker';
import { Source } from '../sources/source';
import { Utils, Nullable } from '../utils/utils';


/** Update interval, in ms */
const UPDATE_INTERVAL = 500;

/** Icons for different power profiles */
const POWER_ICON: { readonly [P in PowerPreference]: string } = Object.freeze({
    'default': '',
    'low-power': '&#x1F50B',
    'high-performance': '&#x26A1'
});

/** Button icons (atlas) */
const BUTTON_ICONS = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAYAAAB3AH1ZAAAAVUlEQVRIS2NkGGDAOMD2M4w6YDQE8IbAfyBgBAJSEipIDy712MzCaTiyQdRwBC4zsDoAmy8ocQQ+vRgOIDUI8UUPMVFIUvySkhaIVTvqgNEQGPAQAABSNiARgz5LggAAAABJRU5ErkJggg==';



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
     */
    constructor()
    {
        this._container = this._createContainer();
        this._lastUpdate = 0;
    }

    /**
     * Initialize the panel
     * @param parent parent node
     * @param isVisible
     */
    init(parent: Node, isVisible: boolean): void
    {
        parent.appendChild(this._container);
        this._container.hidden = !isVisible;
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
     * @param sources the sources of media linked to the session
     * @param trackers the trackers attached to the session
     * @param viewport the viewport
     * @param gpu GPU cycles per second
     * @param fps frames per second
     */
    update(time: DOMHighResTimeStamp, sources: Source[], trackers: Tracker[], viewport: Viewport, gpu: number, fps: number): void
    {
        if(time >= this._lastUpdate + UPDATE_INTERVAL) {
            this._lastUpdate = time;
            this._update(sources, trackers, viewport, fps, gpu);
        }
    }

    /**
     * Update the contents of the panel
     * @param sources the sources of media linked to the session
     * @param trackers the trackers attached to the session
     * @param viewport the viewport
     * @param fps frames per second
     * @param gpu GPU cycles per second
     */
    private _update(sources: Source[], trackers: Tracker[], viewport: Viewport, fps: number, gpu: number): void
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

        const lview = this._label('_ar_view');
        if(lview !== null) {
            const size = viewport.virtualSize;
            lview.innerText = `${size.width}x${size.height} rendering`;
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
        const container = document.createElement('div');

        container.style.position = 'absolute';
        container.style.left = container.style.top = '0px';
        container.style.padding = '0px';

        container.appendChild(this._createTitle());
        container.appendChild(this._createContent());

        return container;
    }

    /**
     * Create a title
     * @returns a title
     */
    private _createTitle(): HTMLElement
    {
        const title = document.createElement('div');
        const button = document.createElement('button');

        title.style.display = 'flex';
        title.style.backgroundColor = '#7e56c2';
        title.style.color = 'white';
        title.style.fontFamily = 'monospace';
        title.style.fontSize = '14px';
        title.style.fontWeight = 'bold';
        title.style.paddingRight = '4px';
        title.innerText = 'encantar.js ' + Utils.engineVersion;

        button.style.width = '18px';
        button.style.height = '18px';
        button.style.marginRight = '4px';
        button.style.backgroundColor = '#7e56c2';
        button.style.backgroundImage = 'url(' + BUTTON_ICONS + ')';
        button.style.backgroundRepeat = 'no-repeat';
        button.style.backgroundPosition = '0 0';
        button.style.borderWidth = '2px';
        button.style.borderColor = '#b588fb #46346a #46346a #b588fb';
        title.insertBefore(button, title.firstChild);

        button.addEventListener('click', () => {
            const container = title.parentNode;
            const details = container && container.querySelector<HTMLElement>('._ar_details');

            if(!details)
                return;

            details.hidden = !details.hidden;
            button.style.backgroundPosition = details.hidden ? '0 0 ' : '-16px 0';
        });

        return title;
    }

    /**
     * Create a content container
     * @returns a content container
     */
    private _createContent(): HTMLElement
    {
        const content = document.createElement('div');
        const details = document.createElement('div');

        content.style.backgroundColor = 'rgba(0,0,0,0.5)';
        content.style.color = 'white';
        content.style.fontFamily = 'monospace';
        content.style.fontSize = '14px';
        content.style.padding = '2px';
        content.style.whiteSpace = 'pre-line';

        details.classList.add('_ar_details');
        details.hidden = true;

        // all sanitized
        const append = (div: HTMLDivElement, html: string): void => div.insertAdjacentHTML('beforeend', html);

        append(content, 'FPS: <span class="_ar_fps"></span> | ');
        append(content, 'GPU: <span class="_ar_gpu"></span> ');
        append(content, '<span class="_ar_power"></span>');

        append(details, 'IN: <span class="_ar_in"></span><br>');
        append(details, 'OUT: <span class="_ar_out"></span><br>');
        append(details, 'VIEW: <span class="_ar_view"></span>');

        // done!
        content.appendChild(details);
        return content;
    }
}