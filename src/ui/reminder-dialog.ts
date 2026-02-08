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
 * reminder-dialog.ts
 * Reminder dialog
 */

/*

Open source software respects and empowers you, but developing it isn't free of
cost. The reminder below asks you to support the project. It may be disabled by
setting the environment variable AR_FLAGS to 1. I know that the reminder may be
a bit annoying to some people, but I've kept it gentle :)

*/

import { Nullable } from '../utils/utils';
declare const __AR_VERSION__: string;
declare const __AR_FLAGS__: string;

/** Title */
const TITLE = 'Purchase your copy of encantar.js!';

/** Message */
const MESSAGE = `encantar.js is an open, fast, easy-to-use, and broadly compatible Augmented Reality solution that works in any modern browser and web server. It has no vendor lock-in, DRM, artificial scarcity, or gatekeeping. Your projects are yours to keep and deploy.

Bringing open Augmented Reality to you isn't free of cost. The depth and breadth of this work are huge, requiring considerable time and skill. I'm a developer working independently on this software from the ground up. Your purchase will support me directly.

This software respects you and puts you in control — values often overlooked in the tech industry. Do you value your freedom? Will you contribute to making open-source sustainable? With a one-time purchase, you'll become a backer of open-source AR — and together, we'll make technology empower us all.`;

/** Text of the primary action button */
const PRIMARY_ACTION = 'Buy now';

/** Text of the secondary action button */
const SECONDARY_ACTION = 'Try it';

/** The URL of the call-to-action */
const TARGET_URL = 'https://alemart.github.io/encantar-js/buy';

/** Seconds in a day */
const ONE_DAY = 86400;

/** Timeout of a reminder, in seconds */
const REMINDER_TIMEOUT = ONE_DAY;

/** LocalStorage key */
const REMINDER_KEY = 'encantar-reminder-' + __AR_VERSION__;

/** Compile-time flags */
const AR_FLAGS = Number(__AR_FLAGS__);




/**
 * Reminder dialog
 */
export class ReminderDialog
{
    /** A dialog element */
    private readonly _dialog: Nullable<HTMLDialogElement>;



    /**
     * Constructor
     */
    constructor()
    {
        this._dialog = this._createDialog();
    }

    /**
     * Initialize
     * @param parent parent node
     */
    init(parent: Node): void
    {
        if(this._dialog !== null) {
            parent.appendChild(this._dialog);
            setTimeout(() => this._show(), 500);
        }
    }

    /**
     * Release
     */
    release(): void
    {
        if(this._dialog !== null)
            this._dialog.remove();
    }

    /**
     * Show the reminder
     * @returns true on success
     */
    private _show(): boolean
    {
        if(this._dialog === null)
            return false;

        this._dialog.showModal();
        return true;
    }

    /**
     * Close the reminder
     * @returns true on success
     */
    private _close(): boolean
    {
        if(this._dialog === null || !this._dialog.open)
            return false;

        const now = Math.floor(Date.now() * 0.001);
        localStorage.setItem(REMINDER_KEY, String(now));

        this._dialog.close();
        return true;
    }

    /**
     * Whether or not the reminder should be displayed at this time
     * @returns a boolean
     */
    private _isEnabled(): boolean
    {
        // Reminder disabled - thanks for supporting open-source AR!
        if(AR_FLAGS & 1)
            return false;

        // Check the time
        const now = Math.floor(Date.now() * 0.001);
        const lastReminder = Number(localStorage.getItem(REMINDER_KEY) ?? '0');
        return now >= lastReminder + REMINDER_TIMEOUT || lastReminder >= now;
    }

    /**
     * Create the dialog element
     * @returns the dialog element
     */
    private _createDialog(): Nullable<HTMLDialogElement>
    {
        const TRANSPARENT_COLOR = 'transparent';
        const BACKGROUND_COLOR = 'whitesmoke';
        const PRIMARY_COLOR = '#6366f1';
        const SECONDARY_COLOR = BACKGROUND_COLOR;
        const PRIMARY_HIGHLIGHTED_COLOR = 'gold';
        const SECONDARY_HIGHLIGHTED_COLOR = 'black';
        const FONT_FAMILY = 'sans-serif';
        const TEXT_COLOR = '#333';
        const TEXT_SIZE = '16px';
        const TITLE_COLOR = PRIMARY_COLOR;
        const TITLE_SIZE = '20px'; // check portrait mode

        // is the reminder disabled?
        if(!this._isEnabled())
            return null;

        // we require <dialog>
        if(typeof HTMLDialogElement === 'undefined')
            return null;

        const dialog = document.createElement('dialog');
        const content = document.createElement('div');
        const title = document.createElement('h1');
        const message = document.createElement('p');
        const buttonWrapper = document.createElement('div');
        const primaryButton = document.createElement('button');
        const secondaryButton = document.createElement('button');
        const closeButton = document.createElement('button');

        dialog.style.width = '95%';
        dialog.style.minWidth = '300px';
        dialog.style.borderRadius = '8px';
        dialog.style.border = 'none';
        dialog.style.backgroundColor = BACKGROUND_COLOR;
        dialog.style.padding = '0';
        dialog.style.boxShadow = '4px 4px 20px rgba(0,0,0,0.75)';
        dialog.style.userSelect = 'none';
        dialog.addEventListener('click', e => dialog === e.target && dialog.close()); // clicked outside the content div

        content.style.textAlign = 'center';
        content.style.fontSize = TEXT_SIZE;
        content.style.fontFamily = FONT_FAMILY;
        content.style.color = TEXT_COLOR;
        content.style.padding = '20px';
        content.style.margin = '0';
        dialog.appendChild(content);

        title.style.fontSize = TITLE_SIZE;
        title.style.color = TITLE_COLOR;
        title.style.margin = '0';
        title.style.fontWeight = 'bold';
        title.innerText = TITLE;
        content.appendChild(title);

        message.innerText = MESSAGE;
        message.style.padding = '8px 0';
        message.style.textAlign = 'justify';
        content.appendChild(message);

        buttonWrapper.style.display = 'flex';
        buttonWrapper.style.justifyContent = 'space-evenly';
        content.appendChild(buttonWrapper);

        const highlight = (el: HTMLElement, bg: string, fg: string, border: string) => (() => {
            el.style.backgroundColor = bg;
            el.style.color = fg;
            el.style.border = '2px solid ' + border;
        });

        primaryButton.style.cursor = 'pointer';
        primaryButton.style.fontSize = TEXT_SIZE;
        primaryButton.style.fontWeight = 'bold';
        primaryButton.style.fontFamily = FONT_FAMILY;
        primaryButton.style.color = SECONDARY_COLOR;
        primaryButton.style.backgroundColor = PRIMARY_COLOR;
        primaryButton.style.border = '2px solid ' + PRIMARY_COLOR;
        primaryButton.style.padding = '12px 24px';
        primaryButton.style.outline = 'none';
        primaryButton.style.minWidth = '120px';
        (primaryButton.style as any)['-webkit-tap-highlight-color'] = TRANSPARENT_COLOR;
        primaryButton.innerText = PRIMARY_ACTION;
        primaryButton.setAttribute('autofocus', '');
        primaryButton.addEventListener('click', () => { location.href = TARGET_URL; this._close(); });
        primaryButton.addEventListener('pointerdown', highlight(primaryButton, PRIMARY_HIGHLIGHTED_COLOR, SECONDARY_HIGHLIGHTED_COLOR, PRIMARY_HIGHLIGHTED_COLOR));
        primaryButton.addEventListener('pointerup', highlight(primaryButton, PRIMARY_COLOR, SECONDARY_COLOR, PRIMARY_COLOR));
        primaryButton.addEventListener('pointerleave', highlight(primaryButton, PRIMARY_COLOR, SECONDARY_COLOR, PRIMARY_COLOR));
        buttonWrapper.appendChild(primaryButton);

        secondaryButton.style.cursor = 'pointer';
        secondaryButton.style.fontSize = TEXT_SIZE;
        secondaryButton.style.fontWeight = 'bold';
        secondaryButton.style.fontFamily = FONT_FAMILY;
        secondaryButton.style.color = PRIMARY_COLOR;
        secondaryButton.style.backgroundColor = SECONDARY_COLOR;
        secondaryButton.style.border = '2px solid ' + PRIMARY_COLOR;
        secondaryButton.style.padding = '12px 24px';
        secondaryButton.style.marginLeft = '12px';
        secondaryButton.style.outline = 'none';
        secondaryButton.style.minWidth = '120px';
        (primaryButton.style as any)['-webkit-tap-highlight-color'] = TRANSPARENT_COLOR;
        (secondaryButton.style as any)['-webkit-tap-highlight-color'] = TRANSPARENT_COLOR;
        secondaryButton.innerText = SECONDARY_ACTION;
        secondaryButton.addEventListener('click', () => this._close());
        secondaryButton.addEventListener('pointerdown', highlight(secondaryButton, PRIMARY_HIGHLIGHTED_COLOR, SECONDARY_HIGHLIGHTED_COLOR, PRIMARY_HIGHLIGHTED_COLOR));
        secondaryButton.addEventListener('pointerup', highlight(secondaryButton, SECONDARY_COLOR, PRIMARY_COLOR, PRIMARY_COLOR));
        secondaryButton.addEventListener('pointerleave', highlight(secondaryButton, SECONDARY_COLOR, PRIMARY_COLOR, PRIMARY_COLOR));
        buttonWrapper.appendChild(secondaryButton);

        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = TEXT_SIZE;
        closeButton.style.fontFamily = FONT_FAMILY;
        closeButton.style.color = TEXT_COLOR;
        closeButton.style.opacity = '0.5';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '8px';
        closeButton.style.right = '8px';
        closeButton.style.border = 'none';
        closeButton.style.padding = '8px';
        closeButton.style.backgroundColor = TRANSPARENT_COLOR;
        closeButton.style.outline = 'none';
        (closeButton.style as any)['-webkit-tap-highlight-color'] = TRANSPARENT_COLOR;
        closeButton.innerHTML = '&#x2715;';
        closeButton.addEventListener('click', () => this._close());
        content.appendChild(closeButton);

        return dialog;
    }
}
