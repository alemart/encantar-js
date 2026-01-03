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
 * ar-events.ts
 * AR-related Events
 */

/**
 * AR Event Type
 * @internal
 */
type AREventType = string;

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
 * Extract the AREventType from an AREvent
 * @internal
 */
type AREventTypeOf<T> = T extends AREvent<infer U> ? U : never;

/**
 * AR Event Listener (a callback)
 * @internal
 */
interface AREventListener<T>
{
    (evt: T extends AREvent<infer U> ? T : never): void;
}

/**
 * AR Event Target
 */
export class AREventTarget<T>
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
    addEventListener(type: AREventTypeOf<T>, callback: AREventListener<T>): void
    {
        this._delegate.addEventListener(type, callback as EventListener);
    }

    /**
     * Remove event listener
     * @param type event type
     * @param callback
     */
    removeEventListener(type: AREventTypeOf<T>, callback: AREventListener<T>): void
    {
        this._delegate.removeEventListener(type, callback as EventListener);
    }

    /**
     * Synchronously trigger an event
     * @param event
     * @returns same value as a standard event target
     * @internal
     */
    dispatchEvent(event: T extends AREvent<infer U> ? T : never): boolean
    {
        return this._delegate.dispatchEvent(event);
    }
}