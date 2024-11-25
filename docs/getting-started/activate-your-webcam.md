# Activate your webcam

In this section we're going to learn how to use your webcam to capture the video. We're also going to polish our work and make it presentable to users.

## Change the source of data

Instead of using a video file, we're going to use your webcam. We simply need to change the source of data and instruct encantar.js to use your webcam. We'll do it with one new line of code!

```js title="ar-demo.js" hl_lines="20-22"
async function startARSession()
{
    if(!AR.isSupported()) {
        throw new Error(
            'This device is not compatible with this AR experience.\n\n' +
            'User agent: ' + navigator.userAgent
        );
    }

    const tracker = AR.Tracker.Image();
    await tracker.database.add([{
        name: 'my-reference-image',
        image: document.getElementById('my-reference-image')
    }]);

    const viewport = AR.Viewport({
        container: document.getElementById('ar-viewport')
    });

    //const video = document.getElementById('my-video'); // comment this line
    //const source = AR.Source.Video(video); // comment this line
    const source = AR.Source.Camera();

    const session = await AR.startSession({
        mode: 'immersive',
        viewport: viewport,
        trackers: [ tracker ],
        sources: [ source ],
        stats: true,
        gizmos: true,
    });

    return session;
}
```

Let's also comment (or remove) the `<video>` tag from the HTML file - we no longer need it:

```html title="index.html" hl_lines="14-19"
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>encantar.js WebAR demo</title>
        <script src="encantar.js"></script>
        <script src="ar-demo.js"></script>
        <style>body { background-color: #3d5afe; }</style>
    </head>
    <body>
        <div id="ar-viewport"></div>
        <img id="my-reference-image" src="my-reference-image.webp" hidden>
        <!--
        <video id="my-video" hidden muted loop playsinline autoplay>
            <source src="my-video.webm" type="video/webm" />
            <source src="my-video.mp4" type="video/mp4" />
        </video>
        -->
    </body>
</html>
```

Open <http://localhost:8000>{ ._blank } and... ta-da! The web browser will ask for your permission to access the camera. Have fun. :wink:

!!! warning "Before using a webcam"

    Pay attention to the following:

    1. Low-quality cameras should be avoided. A camera of a typical smartphone is probably good enough.
    2. Don't move the camera / the target image too quickly, as quick movements produce motion blur.
    3. Ensure good lighting conditions (see below).

!!! tip "Check your physical scene"

    Good lighting conditions are important for a good user experience. Even though the encantar.js can handle various lighting conditions, you should get your physical scene appropriately illuminated.

    When developing your own WebAR experiences, ask yourself:
    
    * Will my users experience AR indoors? If so, make sure that the room is sufficiently illuminated.
    * Will my users experience AR outdoors? In this case, make sure that users interact with your AR experience during the day, or have that interaction happen in a place with sufficient artificial lighting.

    When printing your reference images, avoid shiny materials (e.g., glossy paper). They may generate artifacts in the image and interfere with the tracking. Prefer non-reflective materials.

    If you're using a screen to display the reference image, make sure to adjust the brightness. Too much brightness causes overexposure and loss of detail, leading to tracking difficulties. Not enough brightness is also undesirable, because it makes the reference image look too dark in the video. Screen reflections are also undesirable.

!!! tip "Use HTTPS"

    When distributing your WebAR experiences over the internet, make sure to use HTTPS. Web browsers will only allow access to the webcam in secure contexts.

Here is the reference image in case you need it again:

<figure markdown>
[![/assets/my-reference-image.webp](../assets/my-reference-image.webp "Based on free image by ArtRose from https://pixabay.com/pt/vectors/bruxa-vassoura-gato-chap%c3%a9u-magia-5635225/"){ width=512 }](../assets/my-reference-image.webp){ ._blank }
<figcaption>Reference Image</figcaption>
</figure>


## Create a scan gimmick

Let's polish our work. When the tracker is scanning the physical scene, we'll display a visual cue suggesting the user to frame the target image. I'll call that a scan gimmick.

Save the image below as [scan.png](../assets/scan.png){ ._blank }:

<figure markdown>
<span class="transparent-grid">
[![scan.png](../assets/scan.png)](../assets/scan.png){ ._blank }
</span>
<figcaption>Scan gimmick</figcaption>
</figure>

In order to display that scan gimmick, we need to create a HUD (<em>Heads-Up Display</em>). A HUD is an overlay used to display 2D content in front of the augmented scene. It's part of the viewport. Modify `index.html` and `ar-demo.js` as follows:

```html title="index.html" hl_lines="9-12 15-19"
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>encantar.js WebAR demo</title>
        <script src="encantar.js"></script>
        <script src="ar-demo.js"></script>
        <style>
        body { background-color: #3d5afe; }
        #scan { width: 100%; height: 100%; object-fit: contain; opacity: 0.75; }
        </style>
    </head>
    <body>
        <div id="ar-viewport">
            <div id="ar-hud" hidden>
                <img id="scan" src="scan.png" draggable="false">
            </div>
        </div>
        <img id="my-reference-image" src="my-reference-image.webp" hidden>
        <!--
        <video id="my-video" hidden muted loop playsinline autoplay>
            <source src="my-video.webm" type="video/webm" />
            <source src="my-video.mp4" type="video/mp4" />
        </video>
        -->
    </body>
</html>
```

```js title="ar-demo.js" hl_lines="17-18"
async function startARSession()
{
    if(!AR.isSupported()) {
        throw new Error(
            'This device is not compatible with this AR experience.\n\n' +
            'User agent: ' + navigator.userAgent
        );
    }

    const tracker = AR.Tracker.Image();
    await tracker.database.add([{
        name: 'my-reference-image',
        image: document.getElementById('my-reference-image')
    }]);

    const viewport = AR.Viewport({
        container: document.getElementById('ar-viewport'),
        hudContainer: document.getElementById('ar-hud')
    });

    //const video = document.getElementById('my-video');
    //const source = AR.Source.Video(video);
    const source = AR.Source.Camera();

    const session = await AR.startSession({
        mode: 'immersive',
        viewport: viewport,
        trackers: [ tracker ],
        sources: [ source ],
        stats: true,
        gizmos: true,
    });

    return session;
}
```

Open <http://localhost:8000>{ ._blank }. Now you can see the scan gimmick being displayed... all the time?!

## Configure the scan gimmick

The scan gimmick should only be displayed when the tracker is scanning the physical scene. We should hide it as soon as a target image is recognized. If the tracking is lost, then we need to display it again because we're back in scanning mode.

A simple way to know whether or not we're tracking a target image is to use events. We're going to add two event listeners to our tracker. If a  `targetfound` event happens, we hide the scan gimmick. If a `targetlost` event happens, we show the scan gimmick again.

```js title="ar-demo.js" hl_lines="34-42"
async function startARSession()
{
    if(!AR.isSupported()) {
        throw new Error(
            'This device is not compatible with this AR experience.\n\n' +
            'User agent: ' + navigator.userAgent
        );
    }

    const tracker = AR.Tracker.Image();
    await tracker.database.add([{
        name: 'my-reference-image',
        image: document.getElementById('my-reference-image')
    }]);

    const viewport = AR.Viewport({
        container: document.getElementById('ar-viewport'),
        hudContainer: document.getElementById('ar-hud')
    });

    //const video = document.getElementById('my-video');
    //const source = AR.Source.Video(video);
    const source = AR.Source.Camera();

    const session = await AR.startSession({
        mode: 'immersive',
        viewport: viewport,
        trackers: [ tracker ],
        sources: [ source ],
        stats: true,
        gizmos: true,
    });

    const scan = document.getElementById('scan');

    tracker.addEventListener('targetfound', event => {
        scan.hidden = true;
    });

    tracker.addEventListener('targetlost', event => {
        scan.hidden = false;
    });

    return session;
}
```

## Hide the gizmos

Let's polish our work even more by hiding the gizmos. You may just set `gizmos` to `false` in `AR.startSession()` and there will be no more gizmos. Do the same to hide the stats panel.

Let me show you a different approach. Instead of getting rid of the gizmos completely, we're going to hide them partially. They will be displayed when the tracker is scanning the physical scene, but not when the physical scene is being augmented. That's easy to do with the event listeners we have just set up:

```js title="ar-demo.js" hl_lines="38 43"
async function startARSession()
{
    if(!AR.isSupported()) {
        throw new Error(
            'This device is not compatible with this AR experience.\n\n' +
            'User agent: ' + navigator.userAgent
        );
    }

    const tracker = AR.Tracker.Image();
    await tracker.database.add([{
        name: 'my-reference-image',
        image: document.getElementById('my-reference-image')
    }]);

    const viewport = AR.Viewport({
        container: document.getElementById('ar-viewport'),
        hudContainer: document.getElementById('ar-hud')
    });

    //const video = document.getElementById('my-video');
    //const source = AR.Source.Video(video);
    const source = AR.Source.Camera();

    const session = await AR.startSession({
        mode: 'immersive',
        viewport: viewport,
        trackers: [ tracker ],
        sources: [ source ],
        stats: true,
        gizmos: true,
    });

    const scan = document.getElementById('scan');

    tracker.addEventListener('targetfound', event => {
        scan.hidden = true;
        session.gizmos.visible = false;
    });

    tracker.addEventListener('targetlost', event => {
        scan.hidden = false;
        session.gizmos.visible = true;
    });

    return session;
}
```

Open <http://localhost:8000>{ ._blank } again. Now we're ready to create the augmented scene! :wink: