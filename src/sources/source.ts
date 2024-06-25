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
 * source.ts
 * Abstract source of data
 */

import { SpeedyPromise } from 'speedy-vision/types/core/speedy-promise';

/**
 * Abstract source of data
 */
export interface Source
{
    /** @internal type-identifier of the source of data */
    readonly _type: string;

    /** @internal generic data */
    readonly _data: object;

    /** @internal method to initialize the source of data (gets the data ready) */
    _init(): SpeedyPromise<void>;

    /** @internal method to release the source of data */
    _release(): SpeedyPromise<void>;

    /** @internal stats related to this source of data */
    readonly _stats: string;
}