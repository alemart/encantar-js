# Viewport

The viewport is the area of the web page in which the augmented scene is displayed.

## Instantiation

### AR.Viewport

`AR.Viewport(settings: object): Viewport`

Create a new viewport with the specified `settings`.

**Arguments**

* `settings: object`. An object with the following keys:
    * `container: HTMLDivElement`. A `<div>` that will contain the augmented scene.
    * `hudContainer: HTMLDivElement, optional`. An overlay that will be displayed in front of the augmented scene. It must be a direct child of `container` in the DOM tree.
    * `resolution: Resolution, optional`. The [resolution](resolution.md) of the virtual scene.
    * `canvas: HTMLCanvasElement, optional`. An existing canvas on which the virtual scene will be drawn. The engine automatically creates a canvas. You should only specify an existing canvas if you must. Experimental.
    * `style: string, optional`. The [viewport style](#style). *Since:* 0.3.0
    * `fullscreenUI: boolean, optional`. Whether or not to include, as a convenience, the built-in fullscreen button on platforms in which the fullscreen mode is [available](#fullscreenavailable). Defaults to `true`. *Since:* 0.3.0

**Returns**

A new viewport.

**Example**

```js
const viewport = AR.Viewport({
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

### virtualSize

`viewport.virtualSize: SpeedySize, read-only`

The size in pixels that matches the [resolution](#resolution) of the virtual scene.

### canvas

`viewport.canvas: HTMLCanvasElement, read-only`

A `<canvas>` on which the virtual scene is drawn.

### style

`viewport.style: string, read-only`

The style determines the way the viewport appears on the screen. Different styles are applicable to different [session modes](session.md#mode). The following are valid styles:

* `"best-fit"`: an immersive viewport that is scaled in a way that covers the page while preserving the aspect ratio of the augmented scene.
* `"stretch"`: an immersive viewport that is scaled in a way that covers the entire page, stretching the augmented scene if necessary.
* `"inline"`: an inline viewport that follows the typical flow of a web page.

The default style is `"best-fit"` in immersive mode, or `"inline"` in inline mode.

*Since:* 0.3.0

### fullscreen

`viewport.fullscreen: boolean, read-only`

Whether or not the viewport [container](#container) is being displayed in fullscreen mode. See also: [requestFullscreen](#requestfullscreen).

*Since:* 0.3.0

### fullscreenAvailable

`viewport.fullscreenAvailable: boolean, read-only`

Used to check the availability of the fullscreen mode on the current platform and page.

*Since:* 0.3.0



## Methods

### requestFullscreen

`viewport.requestFullscreen(): SpeedyPromise<void>`

Make a request to the user agent so that the viewport [container](#container) is displayed in fullscreen mode. The user must interact with the page (e.g., tap on a button) in order to comply with [browser policies](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen#security), otherwise the request will not succeed.

!!! info "iPhone support"

    At the time of this writing, the fullscreen mode is [not supported on iPhone](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen#browser_compatibility). An alternative way to create a fullscreen experience is to set the viewport [style](#style) to `"stretch"` in a [web app](https://developer.mozilla.org/en-US/docs/Web/Manifest/display).

*Since:* 0.3.0

**Returns**

A promise that is resolved when the fullscreen mode is activated, or rejected on error.

**Example**

```js
function toggleFullscreen()
{
    if(!viewport.fullscreen) {
        viewport.requestFullscreen().catch(err => {
            alert(`Can't enable fullscreen mode. ` + err.toString());
        });
    }
    else {
        viewport.exitFullscreen();
    }
}

// require user interaction
button.addEventListener('click', toggleFullscreen);
```

### exitFullscreen

`viewport.exitFullscreen(): SpeedyPromise<void>`

Exit fullscreen mode.

*Since:* 0.3.0

**Returns**

A promise that is resolved once the fullscreen mode is no longer active, or rejected on error. The promise will be rejected if the method is called when not in fullscreen mode.

## Events

A viewport is an [AREventTarget](ar-event-target.md). You can listen to the following events:

### resize

The viewport has been resized. This will happen when the user resizes the window of the web browser or when the mobile device is flipped.

**Example**

```js
viewport.addEventListener('resize', () => {
    console.log('The viewport has been resized.');
});
```

### fullscreenchange

The viewport has been switched into or out of fullscreen mode.

*Since:* 0.3.0

**Example**

```js
viewport.addEventListener('fullscreenchange', () => {
    if(viewport.fullscreen)
        console.log('Switched into fullscreen mode');
    else
        console.log('Switched out of fullscreen mode');
});
```
