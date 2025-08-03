# Questions & Answers

## What is encantar.js?

encantar.js is a standalone GPU-accelerated Augmented Reality engine for the web. The name is derived from the Portuguese and Spanish word _encantar_, which means: to enchant, to delight, to love, to fascinate, to put a magical spell on someone or something. :sparkles:

## What is WebAR?

Refer to the [concepts](./tutorial/concepts.md).

## Is this WebXR?

No, encantar.js is not WebXR. The WebXR API allows you to access functionalities of VR and AR-capable devices in web browsers. It relies on other technologies, such as Google's ARCore or Apple's ARKit, to run the show. Those technologies are great, though they are supported on specific devices, which may or may not match your users' devices. On the other hand, encantar.js is fully standalone and is built from scratch using standard web technologies such as WebGL2 and WebAssembly, which are widely supported. My intention is to give it broad compatibility.

## What about browser compatibility?

encantar.js is compatible with all major web browsers:

| Chrome | Edge | Firefox | Opera | Safari* |
| ------ | ---- | ------- | ----- | ------- |
| ✔      | ✔    | ✔       | ✔     | ✔       |

\* use Safari 15.2 or later.

encantar.js requires WebGL2 and WebAssembly, which are widely supported.

## Can I bundle it using Vite, Webpack, etc?

Static linking is not allowed according to the [license](license.md). The inclusion of encantar.js in a web page using a separate script tag does not constitute static linking:

```html
<script src="path/to/encantar.js"></script>
<script src="path/to/my-ar-experience.js"></script>
```

## Why do my models appear "laid down" in AR?

encantar.js uses a right-handed coordinate system with the Z-axis pointing "up". The same convention is used in [Blender](https://www.blender.org){ ._blank }. When exporting your own models, make sure that the Z-axis points "up" and that the ground plane is the XY-plane. If your models appear "laid down" in AR, this is probably the issue.

!!! info "Fix with code"

    Fixing the orientation of the model is the preferred solution. However, you can also fix the issue with code: add a node (entity) to the scene graph and make it rotate its children by 90 degrees around the x-axis.

## Can I increase the resolution of the tracking?

Yes. You can increase the [resolution of the tracker](api/image-tracker.md#instantiation), as well as the [resolution of the camera](api/camera-source.md#instantiation), using the API. You can also increase the resolution of the rendered virtual scene by setting the [resolution of the viewport](api/viewport.md#instantiation). Performance is affected by various factors such as upload times (GPU). Test your AR experience on your target devices to find a good balance between performance and increased resolution.

## How do I know which image is detected?

Add an [event listener](api/image-tracker.md#targetfound) to the Image Tracker, as in the example:

```js
const tracker = AR.Tracker.Image();

// ...

tracker.addEventListener('targetfound', event => {

    // print the name of the Reference Image
    console.log('Found target: ' + event.referenceImage.name);

});
```

## Any recommendations?

Refer to the [recommendations](./recommendations.md).

## I am enchanted!

I know! :wink:
