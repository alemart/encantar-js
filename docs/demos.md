---
title: WebAR Demo gallery
#hide:
#  - navigation
---

# Demo gallery

Please read the [guidelines](#guidelines) before you play with the demos. Feel free to remix them.

## Basic demos

### WebAR with A-Frame

Create an augmented scene with [A-Frame](https://aframe.io){ ._blank }. This is the easiest demo to edit!

[Launch demo](/martins-js/demos/hello-aframe/README.html){ ._blank .md-button }

### WebAR with three.js

Create an augmented scene with [three.js](https://threejs.org){ ._blank }.

[Launch demo](/martins-js/demos/hello-three/README.html){ ._blank .md-button }

### WebAR with WebGL only

Create an augmented scene without additional libraries, for curiosity only.

[Launch demo](/martins-js/demos/hello-webgl/README.html){ ._blank .md-button }

### Hello, world!

A basic template to help you get started.

[Launch demo](/martins-js/demos/hello-world/README.html){ ._blank .md-button }

## Interactive demos

### Touch interaction

Have virtual elements respond to touch input.

[Launch demo](/martins-js/demos/touch-three/README.html){ ._blank .md-button }

## Guidelines

For a good experience:

* Don't move the camera nor the target image too quickly. This produces motion blur.
* The target image should appear clearly in the video.
* The physical environment should be properly illuminated.
* If you're scanning the image on a screen, make sure to adjust the brightness. If the screen is too bright (too dark), it will cause overexposure (underexposure) in the video and tracking difficulties - details of the images will be lost. Screen reflections are also undesirable.
* If you print the image, avoid shiny materials (e.g., glossy paper). They may generate artifacts in the image and interfere with the tracking. Prefer non-reflective materials.
* Avoid low-quality cameras. Cameras of common smartphones are okay.

## Try locally

Try the demos on your own machine:

* Run on a console:

```sh
git clone git@github.com:alemart/martins-js.git
cd martins-js
npm start
```

* Open [https://localhost:8000/demos/](https://localhost:8000/demos/)
* Pick a demo and have fun!
