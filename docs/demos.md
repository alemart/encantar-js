---
title: WebAR demos
---

<style>
.gallery-grid {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-evenly;
}

.gallery-item {
    text-align: center;
    padding: 0;
}

.gallery-item:not(.gallery-item-3) img {
    /*border-radius: 25px;*/
}

@media screen and (min-width: 600px) {
    .gallery-item {
        flex-basis: 80%;
    }
}

@media screen and (min-width: 1220px) {
    .gallery-item {
        transition: transform 0.25s, opacity 0.25s;
        opacity: 0.9;
    }
    .gallery-item:hover {
        /*transform: scale(1.1);*/
        opacity: 1.0;
    }
}
</style>

# WebAR demos

Here you'll find some cool examples of what you can do with MARTINS.js. They are hosted on [Glitch](https://glitch.com){ ._blank }: it's easy to remix them. Simply click on a link or scan any of the QR codes below.

**Important:** after opening the web pages, scan the [reference image below](#reference-image).

## Basic demos

The following demos will help you get started:

<div class="gallery-grid" markdown>
<div class="gallery-item" markdown>
![QR code](./img/qr-demo-hello-aframe.png)

**WebAR with MARTINS.js + AFRAME**

[Launch demo](https://webar-martins-js-hello-aframe.glitch.me){ ._blank } | [View code](https://glitch.com/edit/#!/webar-martins-js-hello-aframe){ ._blank }
</div>
<div class="gallery-item" markdown>
![QR code](./img/qr-demo-hello-three.png)

**WebAR with MARTINS.js + THREE.js**

[Launch demo](https://webar-martins-js-hello-three.glitch.me){ ._blank } | [View code](https://glitch.com/edit/#!/webar-martins-js-hello-three){ ._blank }
</div>
<div class="gallery-item" markdown>
![QR code](./img/qr-demo-hello-webgl.png)

**WebAR with MARTINS.js + pure WebGL**

[Launch demo](https://webar-martins-js-hello-webgl.glitch.me){ ._blank } | [View code](https://glitch.com/edit/#!/webar-martins-js-hello-webgl){ ._blank }
</div>
<div class="gallery-item" markdown>
![](./img/logo-babylonjs.png "Babylon.js logo by David Catuhe")

**WebAR with MARTINS.js + BABYLON.js**

Soon!
</div>
<div class="gallery-item" markdown>
![QR code](./img/qr-demo-hello-world.png)

**Hello, world: minimal example**

[Launch demo](https://webar-martins-js-hello-world.glitch.me){ ._blank } | [View code](https://glitch.com/edit/#!/webar-martins-js-hello-world){ ._blank }
</div>
</div>

!!! tip Tip

    AFRAME is the easiest choice for non-coders. If you're a coder, all choices are good.

## Fun & games

WebAR can be a lot of fun. More demos coming soon!

<div class="gallery-grid" markdown>
<div class="gallery-item" markdown>
![QR code](./img/qr-demo-interactivity-three.png)

**Touch interaction with THREE.js**

[Launch demo](https://webar-martins-js-interactivity-three.glitch.me){ ._blank } | [View code](https://glitch.com/edit/#!/webar-martins-js-interactivity-three){ ._blank }
</div>
</div>


## Reference image

[![Reference image](./assets/my-reference-image.webp)](./assets/my-reference-image.webp){ ._blank }