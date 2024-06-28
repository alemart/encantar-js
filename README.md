# MARTINS.js WebAR engine

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/alemart/martins-js)](https://github.com/alemart/martins-js/releases/) ![GitHub file size in bytes on a specified ref (branch/commit/tag)](https://img.shields.io/github/size/alemart/martins-js/dist/martins.min.js?branch=master&label=minified%20js) [![GitHub Repo stars](https://img.shields.io/github/stars/alemart/martins-js?logo=github)](https://github.com/alemart/martins-js/stargazers) [![GitHub Sponsors](https://img.shields.io/github/sponsors/alemart?logo=github)](https://github.com/sponsors/alemart/)

Create amazing Augmented Reality experiences with **MARTINS.js**, a GPU-accelerated Augmented Reality engine for the web.

:books: Technical documentation is available at <https://alemart.github.io/martins-js/>.

## Features

* **Standalone AR**. Runs in any modern web browser on Android, iOS and even on Desktop computers. No need of WebXR-capable devices.
* **Image tracking**. Use it to track detailed images such as: book covers, cartoons and photos.

## Try WebAR right now!

[Launch a demo!](https://alemart.github.io/martins-js/demo/instructions)

>
> **Guidelines:**
>
> * Don't move the camera too quickly. This produces motion blur.
> * The target image should appear clearly in the video.
> * The physical environment should be properly illuminated.
>

## Try locally

Try the demos on your own machine:

1. Run on a console:

```sh
git clone git@github.com:alemart/martins-js.git
cd martins-js
npm start
```

2. Open https://localhost:8000/demos/
3. Pick a demo and have fun!

## Why use MARTINS.js?

* **No need to download apps!** MARTINS.js is a WebAR engine. It runs in web browsers. Users can access the AR experience immediately.
* **Fast and powerful!** MARTINS.js is GPU-accelerated. It uses WebGL2 and WebAssembly for turbocharged performance.
* **No need of custom hardware or software!** MARTINS.js is built from scratch using standard web technologies. All it requires is a modern web browser.
* **Fully standalone!** MARTINS.js has in it everything it needs to analyze the environment and help you create AR. There are no additional requirements. No need of WebXR.
* **Easy to get started!** MARTINS.js can be used with a `<script>` tag in your page. A static HTML page is enough to get started.

## Browser compatibility

MARTINS.js is compatible with all major web browsers:

| Chrome | Edge | Firefox | Opera | Safari* |
| ------ | ---- | ------- | ----- | ------- |
| ✔      | ✔    | ✔       | ✔     | ✔       |

\* use Safari 15.2 or later.

MARTINS.js requires WebGL2 and WebAssembly.

## About

MARTINS.js is free and open-source software developed by [Alexandre Martins](https://github.com/alemart) and released under the [LGPL](LICENSE.md). It is based on [Speedy Vision](https://github.com/alemart/speedy-vision).
