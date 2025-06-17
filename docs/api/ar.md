# AR

The `AR` namespace is the entry point of the features and components of encantar.js.

!!! tip

    If you're looking for a step-by-step introduction to encantar.js, take a look at the [tutorial](../tutorial/index.md).

## Properties

### Settings

`AR.Settings: Settings, read-only`

The [settings](settings.md) of the engine.

### version

`AR.version: string, read-only`

The version of encantar.js.

## Methods

### isSupported

`AR.isSupported(): boolean`

Checks if the user agent is capable of running the engine.

**Returns**

Returns `true` if the user agent is compatible with the engine, or `false` otherwise.