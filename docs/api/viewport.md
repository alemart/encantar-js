# Viewport

The viewport is the area of the web page in which the augmented scene will be displayed.

## Instantiation

### Martins.Viewport

`Martins.Viewport(settings: object): Viewport`

Create a new viewport with the specified `settings`.

**Arguments**

* `settings: object`. An object with the following keys:
    * `container: HTMLDivElement`. A `<div>` that will contain the augmented scene.
    * `hudContainer: HTMLDivElement, optional`. An overlay that will be displayed in front of the augmented scene. It must be a direct child of `container` in the DOM tree.
    * `resolution: Resolution, optional`. The [resolution](resolution.md) of the virtual scene.
    * `canvas: HTMLCanvasElement, optional`. An existing canvas on which the virtual scene will be drawn. The engine automatically creates a canvas. You should only specify an existing canvas if you must. Experimental.

**Returns**

A new viewport.

**Example**

```js
const viewport = Martins.Viewport({
    container: document.getElementById('ar-viewport'),
    resolution: 'lg'
});
```

## Properties

### container

`viewport.container: HTMLDivElement, read-only`

The container of the viewport.

### hud

`viewport.hud: HUD, read-only`

The [HUD](hud.md).

### resolution

`viewport.resolution: Resolution, read-only`

The [resolution](resolution.md) of the virtual scene.

### canvas

`viewport.canvas: HTMLCanvasElement, read-only`

A `<canvas>` on which the virtual scene is drawn.

### virtualSize

`viewport.virtualSize: SpeedySize, read-only`

The size in pixels that matches the [resolution](#resolution) of the virtual scene.

## Events

A viewport is an [AREventTarget](ar-event-target.md). You can listen to the following events:

### resize

The viewport has been resized. This may happen when the user resizes the window of the web browser or when the mobile device is flipped.

**Example**

```js
viewport.addEventListener('resize', event => {
    console.log('The viewport has been resized.');
});
```