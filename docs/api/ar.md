# AR

The `AR` namespace is the entry point of the features and components of encantAR.js.

I have documented the instantiation of the components of the engine in their respective pages.

## Properties

### Settings

`AR.Settings: Settings, read-only`

The [settings](settings.md) of the engine.

### version

`AR.version: string, read-only`

The version of encantAR.js.

## Methods

### isSupported

`AR.isSupported(): boolean`

Checks if the user agent is capable of running the engine.

**Returns**

Returns `true` if the user agent is compatible with the engine, or `false` otherwise.