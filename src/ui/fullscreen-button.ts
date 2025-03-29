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
 * fullscreen-button.ts
 * A built-in fullscreen button introduced as a convenience
 */

import { Viewport } from '../core/viewport';

/** Button icon to be displayed when the fullscreen mode is disabled */
const BUTTON_ICON_OFF = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAbUlEQVRYR+2WOQ4AIAgE5f+PVhobDZANBZAsraAwXMoqFil+f9GBj8BW8dIiKt45at/XgShStHgvmfdekwAdIIEyAmh1Z/U5ikmABPoRsLZWtt+5DUlgHgGr6qM1Pf9XnO131L7fJEQjyOqXEzjP1YAhNmUTrgAAAABJRU5ErkJggg==';

/** Button icon to be displayed when the fullscreen mode is enabled */
const BUTTON_ICON_ON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAZElEQVRYR+2WwRIAEAhE9f8fTQ5OhtkLxbzOyc5rJSvBYcH3FwTIBKpHb5d57Nqm5o0aCIBAPgLDxSunq69APT8RCBdwezTLHjglDAEQgEC+QZR2EqqbjprHRgSB9wjwHX9LoAHP1YAhXF4Z/QAAAABJRU5ErkJggg==';

/** Button size, in pixels */
const BUTTON_SIZE = 64;

/** Button margin, in pixels */
const BUTTON_MARGIN = 24;



/**
 * Built-in fullscreen button
 */
export class FullscreenButton
{
    /** The viewport associated to this panel */
    private readonly _viewport: Viewport;

    /** The HTML element of the button */
    private readonly _button: HTMLButtonElement;

    /** Bound event handler */
    private readonly _boundEventHandler: EventListener;



    /**
     * Constructor
     * @param viewport Viewport
     */
    constructor(viewport: Viewport)
    {
        this._viewport = viewport;
        this._button = this._createButton();
        this._boundEventHandler = this._handleFullscreenEvent.bind(this);
    }

    /**
     * Initialize
     * @param parent parent node
     * @param isVisible
     */
    init(parent: Node, isVisible: boolean): void
    {
        parent.appendChild(this._button);
        this._button.hidden = !isVisible;
        this._viewport.addEventListener('fullscreenchange', this._boundEventHandler);
    }

    /**
     * Release
     */
    release(): void
    {
        this._viewport.removeEventListener('fullscreenchange', this._boundEventHandler);
        this._button.remove();
    }

    /**
     * Create the <button> element
     */
    private _createButton(): HTMLButtonElement
    {
        const button = document.createElement('button');

        button.style.position = 'absolute';
        button.style.bottom = BUTTON_MARGIN + 'px';
        button.style.right = BUTTON_MARGIN + 'px';
        button.style.width = BUTTON_SIZE + 'px';
        button.style.height = BUTTON_SIZE + 'px';

        button.style.opacity = '0.5';
        button.style.cursor = 'pointer';
        button.style.outline = 'none';
        (button.style as any)['-webkit-tap-highlight-color'] = 'transparent';
        button.draggable = false;

        button.style.backgroundColor = 'transparent';
        button.style.backgroundImage = 'url(' + BUTTON_ICON_OFF + ')';
        button.style.backgroundSize = 'cover';
        button.style.imageRendering = 'pixelated';
        button.style.borderColor = 'white';
        button.style.borderStyle = 'solid';
        button.style.borderWidth = '2px';
        button.style.borderRadius = '8px';

        const highlight = () => {
            button.style.backgroundColor = '#ffd500';
            button.style.borderColor = '#ffd500';
            button.style.opacity = '1.0';
        };

        const dehighlight = () => {
            button.style.backgroundColor = 'transparent';
            button.style.borderColor = 'white';
            button.style.opacity = '0.5';
        };

        button.addEventListener('pointerdown', highlight);
        button.addEventListener('pointerup', dehighlight);
        button.addEventListener('pointerleave', dehighlight);

        button.addEventListener('click', () => {
            if(!this._viewport.fullscreen) {
                this._viewport.requestFullscreen().catch(err => {
                    alert(`Can't enable the fullscreen mode. ` + err.toString());
                });
            }
            else {
                this._viewport.exitFullscreen();
            }
        });

        return button;
    }

    /**
     * Handle a fullscreenchange event
     */
    private _handleFullscreenEvent(event: Event): void
    {
        const img = this._viewport.fullscreen ? BUTTON_ICON_ON : BUTTON_ICON_OFF;
        this._button.style.backgroundImage = 'url(' + img + ')';
    }
}
