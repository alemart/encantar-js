"use strict";
/**
 * @file Engine-agnostic Asset Manager
 * @version 1.1.0
 * @author Alexandre Martins
 * @license Apache-2.0
 */
class AssetManager {
  /**
   * Get an object URL corresponding to a preloaded asset
   * @param {string} filename
   * @returns {string}
   * @throws Throws an error if the asset has not been successfully preloaded
   */
  url(filename) {
    return this._get(filename).url;
  }
  /**
   * Get a File corresponding to a preloaded asset
   * @param {string} filename
   * @returns {File}
   * @throws Throws an error if the asset has not been successfully preloaded
   */
  file(filename) {
    return this._get(filename).file;
  }
  /**
   * Check if an asset has been preloaded successfully
   * @param {string} filename
   * @returns {boolean}
   */
  has(filename) {
    return this._assetMap.has(filename);
  }
  /**
   * Preload one or more assets
   * @param {string|string[]} url URL(s) of the asset(s)
   * @param {object} [options]
   * @param {number} [options.timeout] timeout, in seconds
   * @returns {Promise<void>}
   */
  preload(url, options = {}) {
    if (Array.isArray(url))
      return Promise.all(url.map((url2) => this.preload(url2, options)));
    if (typeof url != "string")
      return Promise.reject(new TypeError());
    const filename = url.substring(1 + url.lastIndexOf("/"));
    if (this._assetMap.has(filename))
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      const seconds = options.timeout !== void 0 ? options.timeout : Infinity;
      const timeoutFn = () => reject(new Error(`Can't preload assets: slow connection! Try refreshing the page.`));
      const timeoutId = isFinite(seconds) ? setTimeout(timeoutFn, seconds * 1e3) : void 0;
      fetch(url).then((response) => {
        if (!response.ok)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.blob();
      }).then((blob) => {
        const file = new File([blob], filename, { type: blob.type });
        const url2 = URL.createObjectURL(file);
        const asset = { file, url: url2 };
        this._assetMap.set(filename, asset);
      }).catch((error) => {
        console.warn(`Can't preload asset "${filename}"! ${error.message} (${url})`);
      }).finally(() => {
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
  _get(filename) {
    const asset = this._assetMap.get(filename);
    if (!asset)
      throw new Error(`Asset "${filename}" has not been preloaded!`);
    return asset;
  }
  /**
   * Constructor
   */
  constructor() {
    this._assetMap = /* @__PURE__ */ new Map();
  }
}
