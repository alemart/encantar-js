/**
 * An Asset Manager for AR
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 * @license LGPL-3.0-or-later
 */

/**
 * The Asset Manager is used to preload resources (models, textures, etc.)
 * You'll typically preload resources before starting the AR session
 */
class AssetManager
{
    /**
     * Get an object URL corresponding to a preloaded asset
     * @param {string} filename
     * @returns {string}
     * @throws Throws an error if the asset has not been successfully preloaded
     */
    url(filename)
    {
        return this._get(filename).url;
    }

    /**
     * Get a File corresponding to a preloaded asset
     * @param {string} filename
     * @returns {File}
     * @throws Throws an error if the asset has not been successfully preloaded
     */
    file(filename)
    {
        return this._get(filename).file;
    }

    /**
     * Check if an asset has been preloaded successfully
     * @param {string} filename
     * @returns {boolean}
     */
    has(filename)
    {
        return this._assetMap.has(filename);
    }

    /**
     * Preload one or more assets
     * @param {string|string[]} url URL(s) of the asset(s)
     * @param {object} [options]
     * @param {number} [options.timeout] timeout, in seconds
     * @returns {Promise<void>}
     */
    preload(url, options = {})
    {
        if(Array.isArray(url))
            return Promise.all(url.map(url => this.preload(url, options)));

        if(typeof url != 'string')
            return Promise.reject(new TypeError());

        const filename = url.substring(1 + url.lastIndexOf('/'));
        if(this._assetMap.has(filename))
            return Promise.resolve();

        return new Promise((resolve, reject) => {
            const seconds = options.timeout !== undefined ? options.timeout : Infinity;
            const timeoutFn = () => reject(new Error(`Can't preload assets: slow connection! Try refreshing the page.`));
            const timeoutId = isFinite(seconds) ? setTimeout(timeoutFn, seconds * 1000) : undefined;

            fetch(url)
            .then(response => {
                if(!response.ok)
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);

                return response.blob();
            })
            .then(blob => {
                const file = new File([ blob ], filename, { type: blob.type });
                const url = URL.createObjectURL(file);
                const asset = { file, url };

                this._assetMap.set(filename, asset);
            })
            .catch(error => {
                console.warn(`Can't preload asset "${filename}"! ${error.message} (${url})`);
            })
            .finally(() => {
                clearTimeout(timeoutId);
                resolve();
            });
        });
    }

    /**
     * Get a preloaded asset
     * @param {string} filename
     * @returns {object}
     * @throws {Error}
     * @internal
     */
    _get(filename)
    {
        const asset = this._assetMap.get(filename);

        if(!asset)
            throw new Error(`Asset "${filename}" has not been preloaded!`);

        return asset;
    }

    /**
     * Constructor
     */
    constructor()
    {
        this._assetMap = new Map();
    }
}
