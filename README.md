# encantar.js: GPU-accelerated Augmented Reality library for the web

Enchant your users with high performance Augmented Reality experiences compatible with any modern web browser. Users don't need to download apps, and WebXR support isn't required.

🧙‍♂️ Get started at <https://encantar.dev>

## Table of contents

* [Features](#features)
* [Demos](#demos)
* [Download](#download)
* [Documentation](#documentation)
* [Support](#support)
* [About](#about)

## Features

* **Broad compatibility** - Create WebAR experiences for all platforms: iOS, Android, Desktops. WebXR support isn't required thanks to encantar's custom trackers based on Computer Vision.
* **High performance** - Deliver blazing fast AR experiences to a wide user base through encantar's GPU-accelerated trackers and WebAssembly-powered computational wizardry.
* **Modularity** - Use encantar.js with the 3D engine of your choice: [A-Frame](https://encantar.dev/api/plugin-aframe), [babylon.js](https://encantar.dev/api/plugin-babylon), [three.js](https://encantar.dev/api/plugin-three), or any other!
* **Image tracking** - Track [custom images](https://encantar.dev/guidelines-for-images) such as cartoons or photos with no need of custom setup. This is known as Natural Feature Tracking.
* **Pointer tracking** - Create interactive experiences based on touch and mouse input with an easy-to-use API.
* **Add-Ons** - Enchant your users with [additional features](https://encantar.dev/addons) that enhance the core of encantar.js!

## Demos

Pick any demo below, or [browse the website](https://encantar.dev/demos) for more!

<a href="https://encantar.dev/demos/hello-aframe/poster.html" target="_blank"><img src="docs/img/mage.gif" alt="Demo" height="144"></a> <a href="https://encantar.dev/demos/basketball/poster.html" target="_blank"><img src="docs/img/basketball.gif" alt="Game" height="144"></a> <a href="https://encantar.dev/addons/ar-video-player" target="_blank"><img src="docs/img/video-player.gif" alt="Video Player" height="144"></a>

## Download

There are two editions: [free](#free-edition) and [commercial](#commercial-edition). They are functionally equivalent, but have [significant differences in usage rights](https://encantar.dev/faq#licensing).

### Free Edition

[Download the Free Edition](https://github.com/alemart/encantar-js/releases/latest) for creating and distributing free and open-source projects, or for developing internal prototypes of non-free/proprietary projects (no distribution rights under the GPL).

```
# Extract the package
unzip encantar-js-VERSION.zip
cd encantar-js-VERSION

# Install the dependencies
npm install

# Build the library and test it with a local web server
npm start

# Build and test with HTTPS
# npm run build && npm run dev -- --secure
```

🪄 Next, open <http://localhost:8000/demos/hello-aframe/video.html>. Also try the [different demos](http://localhost:8000/demos) in a mobile phone. The latest version of the library is ![GitHub Release](https://img.shields.io/github/v/release/alemart/encantar-js?label=%20&color=royalblue)

### Commercial Edition

[Purchase the Commercial Edition](https://encantar.dev/faq#licensing) before deploying your project to production. Use it to distribute non-free/proprietary projects to others (browser delivery counts as distribution).

### Add-Ons

[Get extras for rich AR experiences!](https://encantar.dev/addons)

## Documentation

* [Tutorial for aspiring wizards](https://encantar.dev/tutorial)
* [API Spellbook](https://encantar.dev/api)
* [FAQ](https://encantar.dev/faq)

## Support

👨‍💻 [Contact me](mailto:support@encantar.dev) for library-specific questions or support services.

## About

encantar.js is developed by [Alexandre Martins](https://github.com/alemart) and released under version 3 of the [GNU GPL](LICENSE.md), with optional terms enabling usage in proprietary software. It's based on [speedy-vision](https://github.com/alemart/speedy-vision), a Computer Vision library for JavaScript created by the same author.

Developing an Augmented Reality engine from scratch with Computer Vision is a massive undertaking, yet it happened! 😀