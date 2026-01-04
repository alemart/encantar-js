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
 * hud.ts
 * Heads Up Display
 */

import { Viewport } from './viewport';
import { StatsPanel } from '../ui/stats-panel';
import { FullscreenButton } from '../ui/fullscreen-button';
import { ReminderDialog } from '../ui/reminder-dialog';
import { Nullable, Utils } from '../utils/utils';

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

    /** Container for the internal components */
    private _internalContainer: ShadowRoot;

    /** Stats panel */
    #statsPanel: StatsPanel;

    /** Fullscreen button */
    #fullscreenButton: FullscreenButton;

    /** Reminder dialog */
    #reminderDialog: ReminderDialog;




    /**
     * Constructor
     * @param viewport viewport
     * @param parent parent of the hud container
     * @param hudContainer an existing hud container (optional)
     */
    constructor(viewport: Viewport, parent: HTMLElement, hudContainer: Nullable<HUDContainer> = null)
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

        // create a shadow tree for the internal components
        this._internalContainer = parent.attachShadow({ mode: 'closed' });
        this._internalContainer.appendChild(document.createElement('slot'));

        // create internal components
        this.#statsPanel = new StatsPanel();
        this.#fullscreenButton = new FullscreenButton(viewport);
        this.#reminderDialog = new ReminderDialog();
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
     * @deprecated what's the purpose of this being public?
     */
    get visible(): boolean
    {
        return this._visible;
    }

    /**
     * Whether or not the HUD is visible
     * @deprecated what's the purpose of this being public?
     */
    set visible(visible: boolean)
    {
        // this setter does nothing since 0.4.3
    }

    /**
     * Stats panel
     * @internal
     */
    get _statsPanel(): StatsPanel
    {
        return this.#statsPanel; // same name
    }

    /**
     * Initialize the HUD
     * @param zIndex the z-index of the container
     * @param wantStatsPanel
     * @param wantFullscreenButton
     * @internal
     */
    _init(zIndex: number, wantStatsPanel: boolean, wantFullscreenButton: boolean): void
    {
        const parent = this._internalContainer;
        this.#statsPanel.init(parent, wantStatsPanel);
        this.#fullscreenButton.init(parent, wantFullscreenButton);
        this.#reminderDialog.init(parent);

        for(const element of parent.children as any as HTMLElement[]) {
            if(element.style.getPropertyValue('pointer-events') == '')
                element.style.pointerEvents = 'auto'; // accept pointer input
            if(element.style.getPropertyValue('z-index') == '')
                element.style.zIndex = '1000000';
        }

        const container = this._container;
        container.style.position = 'absolute';
        container.style.left = container.style.top = '0px';
        container.style.right = container.style.bottom = '0px';
        container.style.padding = container.style.margin = '0px';
        container.style.zIndex = String(zIndex);
        container.style.userSelect = 'none';

        this._visible = true;
    }

    /**
     * Release the HUD
     * @internal
     */
    _release(): void
    {
        this._visible = false;

        this.#reminderDialog.release();
        this.#fullscreenButton.release();
        this.#statsPanel.release();

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
        const node = document.createElement('div');

        node.hidden = true;
        parent.insertAdjacentElement('afterbegin', node);

        return node;
    }

    /**
     * Whether or not the HUD is visible
     */
    private get _visible(): boolean
    {
        return !this._container.hidden;
    }

    /**
     * Whether or not the HUD is visible
     */
    private set _visible(visible: boolean)
    {
        this._container.hidden = !visible;
    }
}
