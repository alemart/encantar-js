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
 * errors.ts
 * Error classes
 */

/**
 * Base error class
 */
export abstract class BaseError extends Error
{
    /**
     * Constructor
     * @param message error message
     * @param cause cause of the error
     */
    constructor(message = '', public readonly cause: Error | null = null)
    {
        super(message);
    }

    /**
     * Error name
     */
    public abstract get name(): string;
    /*{
        // incorrect when minified
        //return this.constructor.name;
    }*/

    /**
     * Convert to string
     */
    public toString(): string
    {
        const extendedMessage = this.cause ? '\n-> ' + this.cause.toString() : '';

        if(this.message != '')
            return this.name + ': ' + this.message + extendedMessage;
        else
            return this.name + extendedMessage;
    }
}

/**
 * A method has received one or more illegal arguments
 */
export class IllegalArgumentError extends BaseError
{
    public get name(): string
    {
        return 'IllegalArgumentError';
    }
}

/**
 * The method arguments are valid, but the method can't be called due to the
 * current state of the object
 */
export class IllegalOperationError extends BaseError
{
    public get name(): string
    {
        return 'IllegalOperationError';
    }
}

/**
 * The requested operation is not supported
 */
export class NotSupportedError extends BaseError
{
    public get name(): string
    {
        return 'NotSupportedError';
    }
}

/**
 * Access denied
 */
export class AccessDeniedError extends BaseError
{
    public get name(): string
    {
        return 'AccessDeniedError';
    }
}

/**
 * Timeout
 */
export class TimeoutError extends BaseError
{
    public get name(): string
    {
        return 'TimeoutError';
    }
}

/**
 * Assertion error
 */
export class AssertionError extends BaseError
{
    public get name(): string
    {
        return 'AssertionError';
    }
}

/**
 * Tracking error
 */
export class TrackingError extends BaseError
{
    public get name(): string
    {
        return 'TrackingError';
    }
}

/**
 * Detection error
 */
export class DetectionError extends BaseError
{
    public get name(): string
    {
        return 'DetectionError';
    }
}

/**
 * Training error
 */
export class TrainingError extends BaseError
{
    public get name(): string
    {
        return 'TrainingError';
    }
}