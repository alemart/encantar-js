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
 * hud.ts
 * Heads Up Display
 */

import { Nullable, Utils } from "../utils/utils";

/** HUD container */
export type HUDContainer = HTMLDivElement;

/**
 * Heads Up Display: an overlay displayed in front of the augmented scene
 */
export class HUD
{
    /** Container */
    private _container: HUDContainer;

    /** Whether or not we have created our own container */
    private _isOwnContainer: boolean;



    /**
     * Constructor
     * @param parent parent of the hud container
     * @param hudContainer an existing hud container (optional)
     */
    constructor(parent: HTMLElement, hudContainer: Nullable<HUDContainer>)
    {
        this._container = hudContainer || this._createContainer(parent);
        this._isOwnContainer = (hudContainer == null);

        // move the HUD container to the parent node
        if(this._container.parentElement !== parent) {
            this._container.remove();
            parent.insertAdjacentElement('afterbegin', this._container);
        }

        // the HUD should be hidden initially
        if(!this._container.hidden) {
            Utils.warning(`The container of the HUD should have the hidden attribute`);
            this._container.hidden = true;
        }
    }

    /**
     * The container of the HUD
     */
    get container(): HUDContainer
    {
        return this._container;
    }

    /**
     * Whether or not the HUD is visible
     */
    get visible(): boolean
    {
        return !this._container.hidden;
    }

    /**
     * Whether or not the HUD is visible
     */
    set visible(visible: boolean)
    {
        this._container.hidden = !visible;
    }

    /**
     * Initialize the HUD
     * @param zIndex the z-index of the container
     * @internal
     */
    _init(zIndex: number): void
    {
        const container = this._container;

        container.style.position = 'absolute';
        container.style.left = container.style.top = '0px';
        container.style.right = container.style.bottom = '0px';
        container.style.padding = container.style.margin = '0px';
        container.style.zIndex = String(zIndex);
        container.style.userSelect = 'none';

        this.visible = true;
    }

    /**
     * Release the HUD
     * @internal
     */
    _release(): void
    {
        this.visible = false;

        if(this._isOwnContainer) {
            this._isOwnContainer = false;
            this._container.remove();
        }
    }

    /**
     * Create a HUD container as an immediate child of the input node
     * @param parent parent container
     * @returns HUD container
     */
    private _createContainer(parent: HTMLElement): HUDContainer
    {
        const node = document.createElement('div') as HTMLDivElement;

        node.hidden = true;
        parent.insertAdjacentElement('afterbegin', node);

        return node;
    }
}