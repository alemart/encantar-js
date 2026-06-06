/*
 * encantar.js
 * GPU-accelerated Augmented Reality library for the web
 * Copyright (C) 2022-2026 Alexandre Martins <alemartf(at)gmail.com>
 *
 * This library is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library.  If not, see <https://www.gnu.org/licenses/>.
 *
 * watermark.ts
 * Library Watermark
 */

/******************************************************************************
 *                                                                            *
 * PRESERVATION OF AUTHOR ATTRIBUTIONS AND LEGAL NOTICES                      *
 *                                                                            *
 * Pursuant to Section 7(b) of the GNU General Public License version 3       *
 * ("GPLv3"), you must retain the author attributions and the legal notices   *
 * displayed by means of the encantar.js Library Watermark in all works that  *
 * are combined with or linked to this library, as well as in all other works *
 * based on this library, and in the form of convenient and prominently       *
 * visible Appropriate Legal Notices (defined in the GPLv3).                  *
 *                                                                            *
 * You may not propagate or modify a covered work except as expressly         *
 * provided under the License, which includes this requirement to preserve    *
 * the specified author attributions and legal notices in the user interface. *
 * Any attempt otherwise to propagate or modify a covered work is void, and   *
 * will automatically terminate your rights under the License                 *
 * (the termination procedure of the GPLv3 applies).                          *
 *                                                                            *
 * For more information, read the FAQ at                                      *
 * https://alemart.github.io/encantar-js/faq                                  *
 *                                                                            *
 ******************************************************************************/

import { Nullable } from '../utils/utils';
import { AR_FLAGS } from '../utils/metadata';

const WATERMARK_CONTENT = '<svg width="96" height="48" xmlns="http://www.w3.org/2000/svg"><text x="8" y="31" fill="currentColor" font-family="sans-serif" font-weight="bold" font-size="10px" text-decoration="none">Made with</text><text x="8" y="43" fill="currentColor" font-family="sans-serif" font-weight="bold" font-size="14px" text-decoration="underline">encantar.js</text></svg>';
const WATERMARK_COLOR = `rgba(255, 255, 255, 0.5)`;
const WATERMARK_HIGHLIGHTED_COLOR = `rgba(255, 215, 0, 0.8)`;

const ABOUT_BACKGROUND_COLOR = 'whitesmoke';
const ABOUT_PRIMARY_COLOR = 'royalblue';
const ABOUT_SECONDARY_COLOR = ABOUT_BACKGROUND_COLOR;
const ABOUT_PRIMARY_HIGHLIGHTED_COLOR = 'gold';
const ABOUT_SECONDARY_HIGHLIGHTED_COLOR = 'black';
const ABOUT_TEXT_COLOR = '#333';
const ABOUT_TEXT_SIZE = '16px';
const ABOUT_FONT_FAMILY = 'sans-serif';
const ABOUT_WEBSITE = 'https://github.com/alemart/encantar-js';

const ABOUT_ICON = '&#x1F9D9;&#x200D;&#x2642;';
const ABOUT_TITLE = ABOUT_ICON + '<br>encantar.js';
const ABOUT_SUBTITLE = 'GPU-accelerated Augmented Reality library for the web';
const ABOUT_COPYRIGHT = 'Copyright (C) 2022-2026 Alexandre Martins'.replace('(C)', '&copy;');
const ABOUT_LEGAL = `This work is made with <a href="${ABOUT_WEBSITE}" rel="external" style="color:${ABOUT_PRIMARY_COLOR};text-decoration:underline">encantar.js</a>, a free and open-source library for creating Augmented Reality experiences for the web. You can redistribute it under the terms of the <a href="https://www.gnu.org/licenses" rel="license" style="color:${ABOUT_PRIMARY_COLOR};text-decoration:underline">GNU General Public License version 3</a>. This library is provided "AS IS", WITHOUT ANY WARRANTY.`;
const ABOUT_SUPPLEMENT = 'With encantar.js, a modern web browser is all you need to experience Augmented Reality (AR). Discover how you too can create magical AR content that works everywhere, with no need to download apps!';
const ABOUT_PRIMARY_ACTION = 'Show me';
const ABOUT_SECONDARY_ACTION = 'Not now';

/**
 * About box
 */
class AboutBox
{
    /** A dialog element */
    private _dialog: Nullable<HTMLDialogElement>;

    /** Parent element */
    private _parent: Nullable<Node>;



    /**
     * Constructor
     */
    constructor()
    {
        this._dialog = null;
        this._parent = null;
    }

    /**
     * Initialize
     * @param parent parent node
     */
    init(parent: Node): void
    {
        this._parent = parent;
    }

    /**
     * Release
     */
    release(): void
    {
        if(this._dialog !== null)
            this._dialog.remove();

        this._dialog = null;
        this._parent = null;
    }

    /**
     * Show the About box
     * @returns true on success
     */
    show(): boolean
    {
        if(this._dialog === null) {

            // lazily create the dialog
            if(null === this._parent || null === (this._dialog = this._createDialog()))
                return false;

            this._parent.appendChild(this._dialog);

        }

        this._dialog.showModal();
        return true;
    }

    /**
     * Reparent
     * @param newParent new parent node
     * @internal
     */
    _reparent(newParent: Node): void
    {
        if(newParent !== this._parent) {
            this.release();
            this.init(newParent);
        }
    }

    /**
     * Create the dialog element
     */
    private _createDialog(): Nullable<HTMLDialogElement>
    {
        // Safari 15.4+ is required for <dialog>
        if(typeof HTMLDialogElement === 'undefined')
            return null;

        const dialog = document.createElement('dialog');
        const wrapper = document.createElement('div');
        const textWrapper = document.createElement('div');
        const title = document.createElement('h1');
        const subtitle = document.createElement('h2');
        const copyright = document.createElement('h3');
        const firstParagraph = document.createElement('p');
        const secondParagraph = document.createElement('p');
        const buttonWrapper = document.createElement('div');
        const quitButton = document.createElement('button');
        const infoButton = document.createElement('button');

        dialog.style.width = '67%';
        dialog.style.minWidth = '300px';
        dialog.style.maxWidth = '800px';
        dialog.style.borderRadius = '8px';
        dialog.style.border = 'none';
        dialog.style.backgroundColor = ABOUT_BACKGROUND_COLOR;
        dialog.style.color = ABOUT_TEXT_COLOR;
        dialog.style.padding = '0';
        dialog.style.boxShadow = '4px 4px 20px rgba(0,0,0,0.75)';
        dialog.style.textAlign = 'center';
        dialog.style.fontSize = ABOUT_TEXT_SIZE;
        dialog.style.fontFamily = ABOUT_FONT_FAMILY;
        dialog.style.userSelect = 'none';
        dialog.style.pointerEvents = 'auto';
        dialog.style.letterSpacing = '0.25px';
        dialog.addEventListener('click', e => dialog === e.target && dialog.close());

        wrapper.style.padding = '24px';
        dialog.appendChild(wrapper);

        title.style.fontSize = '2.25em'; // check portrait mode
        title.style.color = ABOUT_PRIMARY_COLOR;
        title.style.margin = '4px 0';
        title.innerHTML = ABOUT_TITLE;
        wrapper.appendChild(title);

        subtitle.style.fontSize = '1.35em';
        subtitle.style.color = ABOUT_PRIMARY_COLOR;
        subtitle.style.margin = '4px 0';
        subtitle.innerHTML = ABOUT_SUBTITLE;
        wrapper.appendChild(subtitle);

        copyright.style.fontSize = '1.1em';
        copyright.style.color = ABOUT_PRIMARY_COLOR;
        copyright.style.margin = '4px 0';
        copyright.innerHTML = ABOUT_COPYRIGHT;
        wrapper.appendChild(copyright);

        textWrapper.style.padding = '8px 0';
        textWrapper.style.textAlign = 'justify';
        wrapper.appendChild(textWrapper);

        firstParagraph.innerHTML = ABOUT_LEGAL;
        textWrapper.appendChild(firstParagraph);

        secondParagraph.innerText = ABOUT_SUPPLEMENT;
        textWrapper.appendChild(secondParagraph);

        buttonWrapper.style.display = 'flex';
        buttonWrapper.style.justifyContent = 'center';
        wrapper.appendChild(buttonWrapper);

        const highlight = (el: HTMLElement, bg: string, fg: string, border: string) => (() => {
            el.style.backgroundColor = bg;
            el.style.color = fg;
            el.style.border = '2px solid ' + border;
        });

        infoButton.style.cursor = 'pointer';
        infoButton.style.fontSize = ABOUT_TEXT_SIZE;
        infoButton.style.fontWeight = 'bold';
        infoButton.style.fontFamily = ABOUT_FONT_FAMILY;
        infoButton.style.color = ABOUT_SECONDARY_COLOR;
        infoButton.style.backgroundColor = ABOUT_PRIMARY_COLOR;
        infoButton.style.border = '2px solid ' + ABOUT_PRIMARY_COLOR;
        infoButton.style.padding = '12px 24px';
        infoButton.style.outline = 'none';
        (infoButton.style as any)['-webkit-tap-highlight-color'] = 'transparent';
        infoButton.innerText = ABOUT_PRIMARY_ACTION;
        infoButton.setAttribute('autofocus', '');
        infoButton.addEventListener('click', () => (location.href = ABOUT_WEBSITE, dialog.close()));
        infoButton.addEventListener('pointerdown', highlight(infoButton, ABOUT_PRIMARY_HIGHLIGHTED_COLOR, ABOUT_SECONDARY_HIGHLIGHTED_COLOR, ABOUT_PRIMARY_HIGHLIGHTED_COLOR));
        infoButton.addEventListener('pointerup', highlight(infoButton, ABOUT_PRIMARY_COLOR, ABOUT_SECONDARY_COLOR, ABOUT_PRIMARY_COLOR));
        infoButton.addEventListener('pointerleave', highlight(infoButton, ABOUT_PRIMARY_COLOR, ABOUT_SECONDARY_COLOR, ABOUT_PRIMARY_COLOR));
        buttonWrapper.appendChild(infoButton);

        quitButton.style.cursor = 'pointer';
        quitButton.style.fontSize = ABOUT_TEXT_SIZE;
        quitButton.style.fontWeight = 'bold';
        quitButton.style.fontFamily = ABOUT_FONT_FAMILY;
        quitButton.style.color = ABOUT_PRIMARY_COLOR;
        quitButton.style.backgroundColor = ABOUT_SECONDARY_COLOR;
        quitButton.style.border = '2px solid ' + ABOUT_PRIMARY_COLOR;
        quitButton.style.padding = '12px 24px';
        quitButton.style.marginLeft = '12px';
        quitButton.style.outline = 'none';
        (quitButton.style as any)['-webkit-tap-highlight-color'] = 'transparent';
        quitButton.innerText = ABOUT_SECONDARY_ACTION;
        quitButton.addEventListener('click', () => dialog.close());
        quitButton.addEventListener('pointerdown', highlight(quitButton, ABOUT_PRIMARY_HIGHLIGHTED_COLOR, ABOUT_SECONDARY_HIGHLIGHTED_COLOR, ABOUT_PRIMARY_HIGHLIGHTED_COLOR));
        quitButton.addEventListener('pointerup', highlight(quitButton, ABOUT_SECONDARY_COLOR, ABOUT_PRIMARY_COLOR, ABOUT_PRIMARY_COLOR));
        quitButton.addEventListener('pointerleave', highlight(quitButton, ABOUT_SECONDARY_COLOR, ABOUT_PRIMARY_COLOR, ABOUT_PRIMARY_COLOR));
        buttonWrapper.appendChild(quitButton);

        return dialog;
    }
}

/**
 * Watermark
 */
export class Watermark
{
    /** The graphic of the Watermark */
    private readonly _graphic: HTMLElement;

    /** About box */
    private readonly _aboutBox: AboutBox;

    /** Parent node */
    private _parent: Nullable<Node>;




    /**
     * Constructor
     */
    constructor()
    {
        this._parent = null;
        this._graphic = this._createGraphic();
        this._aboutBox = new AboutBox();
    }

    /**
     * Initialize
     * @param parent parent node
     */
    init(parent: Node): void
    {
        this._parent = parent;
        parent.appendChild(this._graphic);
        this._aboutBox.init(parent);
    }

    /**
     * Release
     */
    release(): void
    {
        this._aboutBox.release();
        this._graphic.remove();
        this._parent = null;
    }

    /**
     * A reference to the About box
     */
    get aboutBox(): AboutBox
    {
        return this._aboutBox;
    }

    /**
     * Reparent
     * @param newParent new parent node, or null to revert to the original parent
     * @internal
     */
    _reparent(newParent: Nullable<Node>): void
    {
        // nothing to do?
        if(newParent === this._parent)
            return;

        // revert to the original parent?
        if(newParent === null)
            newParent = this._parent;

        // uninitialized Watermark?
        if(newParent === null)
            return;

        // reparent
        newParent.appendChild(this._graphic);
        this._aboutBox._reparent(newParent);
    }

    /**
     * Create the graphic
     */
    private _createGraphic(): HTMLElement
    {
        const button = document.createElement('button');

        button.style.position = 'absolute';
        button.style.bottom = '0';
        button.style.left = '0';
        button.style.padding = '0';
        button.style.margin = '0';

        button.style.cursor = 'pointer';
        button.style.userSelect = 'none';
        button.style.pointerEvents = 'auto';
        button.style.outline = 'none';
        button.style.border = 'none';
        button.style.background = 'none';
        (button.style as any)['-webkit-tap-highlight-color'] = 'transparent';
        button.draggable = false;
        button.hidden = !!(AR_FLAGS & 1);

        /*button.style.fontFamily = 'sans-serif';
        button.style.fontVariant = 'small-caps';
        button.style.fontSize = '16px';
        button.style.fontWeight = 'bold';
        button.style.textDecoration = 'underline';
        button.style.textAlign = 'left';*/
        button.style.color = WATERMARK_COLOR;
        button.innerHTML = WATERMARK_CONTENT;
        (button as any).ariaDescription = 'Made with encantar.js';

        const setPressed = (isPressed: boolean) =>
            (() => void(button.style.color = isPressed ? WATERMARK_HIGHLIGHTED_COLOR : WATERMARK_COLOR));

        button.addEventListener('click', () => this._aboutBox.show());
        button.addEventListener('pointerdown', setPressed(true));
        button.addEventListener('pointerup', setPressed(false));
        button.addEventListener('pointerleave', setPressed(false));

        return button;
    }
}