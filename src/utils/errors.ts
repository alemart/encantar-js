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

type MartinsErrorCause = Error | null;

/**
 * Generic error class
 */
export abstract class MartinsError extends Error
{
    /**
     * Constructor
     * @param message error message
     * @param cause optional error cause
     */
    constructor(message = '', public readonly cause: MartinsErrorCause = null)
    {
        super([
            message,
            cause ? cause.toString() : '[martins-js]'
        ].join('\n-> '));
    }

    /**
     * Error name
     */
    public get name(): string
    {
        return this.constructor.name;
    }
}

/**
 * A method has received one or more illegal arguments
 */
export class IllegalArgumentError extends MartinsError
{
}

/**
 * The method arguments are valid, but the method can't be called due to the
 * current state of the object
 */
export class IllegalOperationError extends MartinsError
{
}

/**
 * The requested operation is not supported
 */
export class NotSupportedError extends MartinsError
{
}

/**
 * Access denied
 */
export class AccessDeniedError extends MartinsError
{
}

/**
 * Timeout
 */
export class TimeoutError extends MartinsError
{
}

/**
 * Assertion error
 */
export class AssertionError extends MartinsError
{
}

/**
 * Tracking error
 */
export class TrackingError extends MartinsError
{
}

/**
 * Detection error
 */
export class DetectionError extends MartinsError
{
}

/**
 * Training error
 */
export class TrainingError extends MartinsError
{
}