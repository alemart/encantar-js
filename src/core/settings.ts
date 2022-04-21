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
 * settings.ts
 * Global Settings
 */

import Speedy from 'speedy-vision';
import { Session } from './session';
import { IllegalArgumentError, IllegalOperationError } from '../utils/errors';
import { Utils } from '../utils/utils';

/** Power preference (may impact performance x battery life) */
export type PowerPreference = 'default' | 'low-power' | 'high-performance';

/**
 * Global Settings
 */
export class Settings
{
    private static _powerPreference: PowerPreference = 'default';

    /**
     * Power preference (may impact performance x battery life)
     */
    static get powerPreference(): PowerPreference
    {
        return this._powerPreference;
    }

    /**
     * Power preference (may impact performance x battery life)
     * Note: this setting should be the very first thing you set
     * (before the WebGL context is created by Speedy)
     */
    static set powerPreference(value: PowerPreference)
    {
        // validate
        if(Session.count > 0)
            throw new IllegalOperationError(`Can't change the powerPreference while there are active sessions going on`);
        else if(!('low-power' == value || 'default' == value || 'high-performance' == value))
            throw new IllegalArgumentError(`Invalid powerPreference: "${value}"`);

        /*
        // we won't use 'high-performance' for Speedy's GPU computations
        // see the WebGL 1.0 spec sec 5.2.1 for battery life considerations
        // also, it seems like low-power mode may break WebGL2 in some drivers?!

        if(value == 'high-performance')
            Speedy.Settings.powerPreference = 'default';
        else
            Speedy.Settings.powerPreference = value;
        */

        // change the GPU polling mode
        if(value == 'high-performance')
            Speedy.Settings.gpuPollingMode = 'asap';
        else
            Speedy.Settings.gpuPollingMode = 'raf';

        // update the power preference
        this._powerPreference = value;

        // log
        Utils.log(`Changed the powerPreference to "${this._powerPreference}"`);
    }
}