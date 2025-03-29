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
 * support-widget.ts
 * Support widget
 */

/*

This widget is intended to ask users to support the project

You are asked to support the project!

https://encantar.dev/supporter

*/

declare const __AR_FLAGS__: number;

/**
 * Support widget
 */
export class SupportWidget
{
    /** The element of the widget */
    private readonly _element: HTMLElement;



    /**
     * Constructor
     */
    constructor()
    {
        this._element = this._createElement();
    }

    /**
     * Initialize
     * @param parent parent node
     */
    init(parent: Node): void
    {
        parent.appendChild(this._element);
    }

    /**
     * Release
     */
    release(): void
    {
        this._element.remove();
    }

    /**
     * Create the element of the widget
     */
    private _createElement(): HTMLElement
    {
        const button = document.createElement('button');

        button.innerText = 'Support encantar.js';
        button.style.font = 'bold small-caps 1.25rem sans-serif';
        button.style.color = 'white';
        button.style.padding = '0.5rem';
        button.style.maxWidth = '40%';

        button.style.position = 'absolute';
        button.style.bottom = '0';
        button.style.right = '50%';
        button.style.transform = 'translateX(50%)';

        button.style.opacity = '0.75';
        button.style.zIndex = '1000000';
        button.style.cursor = 'pointer';
        button.style.outline = 'none';
        (button.style as any)['-webkit-tap-highlight-color'] = 'transparent';
        button.draggable = false;
        button.hidden = !!(__AR_FLAGS__ & 1);

        button.style.backgroundColor = 'rgba(0,0,0,0.25)';
        button.style.borderColor = 'white';
        button.style.borderStyle = 'solid';
        button.style.borderWidth = '2px';
        button.style.borderTopLeftRadius = '8px';
        button.style.borderTopRightRadius = '8px';
        button.style.borderBottomStyle = 'none';

        const highlight = () => {
            button.style.backgroundColor = '#ffd500';
            button.style.borderColor = '#ffd500';
            button.style.opacity = '1.0';
        };

        const dehighlight = () => {
            button.style.backgroundColor = 'rgba(0,0,0,0.25)';
            button.style.borderColor = 'white';
            button.style.opacity = '0.75';
        };

        button.addEventListener('pointerdown', highlight);
        button.addEventListener('pointerup', dehighlight);
        button.addEventListener('pointerleave', dehighlight);
        button.addEventListener('click', () => {
            location.href = 'https://encantar.dev/supporter';
        });

        return button;
    }
}
