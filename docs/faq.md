# Questions & Answers

## What is encantAR.js?

encantAR.js is a standalone GPU-accelerated Augmented Reality engine for the web. The name derives from the Portuguese and Spanish word _encantar_, which means: to enchant, to delight, to love, to fascinate, to put a magical spell on someone or something. :sparkles:

## What is WebAR?

Refer to the [concepts](./getting-started/concepts.md).

## Is this WebXR?

No, encantAR.js is not WebXR. The WebXR API allows you to access functionalities of VR and AR-capable devices in web browsers. It relies on other technologies, such as Google's ARCore or Apple's ARKit, to run the show. Those technologies are great, but they are supported on specific devices, which may or may not match your users' devices. On the other hand, encantAR.js is fully standalone and is built from scratch using standard web technologies such as WebGL2 and WebAssembly, which are widely available. My intention is to give it broad compatibility.

## Why do my models appear "laid down" in AR?

encantAR.js uses a right-handed coordinate system with the Z-axis pointing "up". The same convention is used in [Blender](https://www.blender.org){ ._blank }. When exporting your own models, make sure that the Z-axis points "up" and that the ground plane is the XY-plane. If your models appear "laid down" in AR, this is probably the issue.

!!! info "Fix with code"

    Fixing the orientation of the model is the preferred solution. However, you can also fix the issue with code: add a node (entity) to the scene graph and make it rotate its children by 90 degrees around the x-axis.

## How can I contact you?

[Get in touch!](https://github.com/alemart)

## I am enchanted!

I know! :wink: