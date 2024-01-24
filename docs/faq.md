# Questions & Answers

## What is MARTINS.js?

MARTINS.js is a GPU-accelerated Augmented Reality engine for the web. It's a standalone WebAR technology for creating AR experiences that run in web browsers. Users don't need specialized hardware nor dedicated software - only a modern web browser.

MARTINS is a recursive acronym for MARTINS Augmented Reality Technology for Internet Software. It also happens to be my name. See, AR is part of my name. Can you believe it? :sunglasses:

## What is WebAR?

Refer to the [concepts](./getting-started/concepts.md).

## Is this WebXR?

No, MARTINS.js is not WebXR. The WebXR API allows you to access functionalities of VR and AR-capable devices in web browsers. It relies on other technologies, such as Google's ARCore or Apple's ARKit, to run the show. Those technologies are great, but they are supported on specific devices, which may or may not match your users' devices. On the other hand, MARTINS.js is fully standalone and is built from scratch using standard web technologies such as WebGL2 and WebAssembly, which are widely available. My intention is to give it broad compatibility.

## Why do my models appear "laid down" in AR?

MARTINS.js uses a right-handed coordinate system with the Z-axis pointing "up". The same convention is used in [Blender](https://www.blender.org){ ._blank }. When exporting your own models, make sure that the Z-axis points "up" and that the ground plane is the XY-plane. If your models appear "laid down" in AR, this is probably the issue.

!!! info "Fix with code"

    Fixing the orientation of the model is the preferred solution. However, you can also fix the issue with code: add a node (entity) to the scene graph and make it rotate its children by 90 degrees around the x-axis.

## How can I contact you?

[Get in touch!](https://github.com/alemart)

## I love WebAR!

I know! :wink: