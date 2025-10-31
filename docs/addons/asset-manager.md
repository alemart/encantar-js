# Asset Manager

A framework-agnostic solution for preloading assets such as: 3D models, video clips, audio files and more. Preloading assets is typically done in the `preload()` method when using the plugins for [babylon.js](../api/plugin-babylon.md#preload) or [three.js](../api/plugin-three.md#preload). This Add-On is bundled with the core.

## Methods

### preload

`assetManager.preload(url: string | string[], options?: object): Promise<void>`

Preload one or more assets.

**Arguments**

* `url: string | string[]`. Absolute or relative URL(s) of the asset(s).
* `options: object, optional`. An object with the following keys (all are optional):
    * `timeout: number`. Timeout value, in seconds. Defaults to infinity (i.e., no timeout).

**Returns**

A promise that is resolved as soon as all assets are preloaded, or that is rejected on error.

**Example**

```js
class MyDemo exports ARDemo
{
    // ...

    preload()
    {
        return this._assetManager.preload([
            'assets/mage.glb',
            'assets/cat.glb',
            'assets/meow.wav',
        ], { timeout: 30 });
    }

    // ...

    constructor()
    {
        super();

        // ...

        this._assetManager = new AssetManager();

        // ...
    }
}
```

### url

`assetManager.url(filename: string): string`

Gets an [object URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static){ ._blank } of a preloaded asset.

**Arguments**

* `filename: string`. The filename of the asset.

**Returns**

An object URL.

**Example**

```js
// If the asset is located at "assets/mage.glb",
// then its filename is "mage.glb"
const mageURL = this._assetManager.url('mage.glb');
```

### file

`assetManager.file(filename: string): File`

Gets a [File](https://developer.mozilla.org/en-US/docs/Web/API/File){ ._blank } corresponding to a preloaded asset.

**Arguments**

* `filename: string`. The filename of the asset.

**Returns**

A File object.

### has

`assetManager.has(filename: string): boolean`

Checks if an asset has been preloaded.

**Arguments**

* `filename: string`. The filename of the asset.

**Returns**

Returns `true` if an asset with the given `filename` has been preloaded.
