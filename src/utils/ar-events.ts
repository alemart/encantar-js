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
 * ar-events.ts
 * AR-related Events
 */

/**
 * AR Event Type
 */
type AREventType = string;

/**
 * AR Event Listener (callback)
 */
export type AREventListener = EventListener;

/**
 * AR Event
 */
export class AREvent<T extends AREventType> extends Event
{
    /**
     * Constructor
     * @param type event type
     */
    constructor(type: T)
    {
        super(type);
    }

    /**
     * Event type
     */
    get type(): T
    {
        return super.type as T;
    }
}

/**
 * AR Event Target
 */
export class AREventTarget<T extends AREventType> implements EventTarget
{
    /** event target delegate */
    private readonly _delegate: EventTarget;



    /**
     * Constructor
     */
    constructor()
    {
        this._delegate = new EventTarget();
    }

    /**
     * Add event listener
     * @param type event type
     * @param callback
     */
    addEventListener(type: T, callback: AREventListener): void
    {
        this._delegate.addEventListener(type, callback);
    }

    /**
     * Remove event listener
     * @param type event type
     * @param callback
     */
    removeEventListener(type: T, callback: AREventListener): void
    {
        this._delegate.removeEventListener(type, callback);
    }

    /**
     * Synchronously trigger an event
     * @param event
     * @returns same value as a standard event target
     * @internal
     */
    dispatchEvent(event: AREvent<T>): boolean
    {
        return this._delegate.dispatchEvent(event);
    }
}