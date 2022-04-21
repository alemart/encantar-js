# Next steps

Congratulations! You have created your first WebAR experience with MARTINS.js! :sunglasses:

Let me tell you some of the steps you can take from now on.

## Change the power preference

Image tracking is no trivial task: lots of computations are being performed behind the scenes. The WebAR engine prioritizes processing performance over power consumption by default. You may reduce power consumption by reducing processing performance. This is simple to do: just set `Martins.Settings.powerPreference` to `"low-power"`.

```js title="ar-demo.js" hl_lines="10"
async function startARSession()
{
    if(!Martins.isSupported()) {
        throw new Error(
            'Use a browser/device compatible with WebGL2 and WebAssembly. ' +
            'Your user agent is ' + navigator.userAgent
        );
    }

    Martins.Settings.powerPreference = 'low-power'; // OPTIONAL

    const tracker = Martins.Tracker.ImageTracker();
    await tracker.database.add([{
        name: 'my-reference-image',
        image: document.getElementById('my-reference-image')
    }]);

    const viewport = Martins.Viewport({
        container: document.getElementById('ar-viewport'),
        hudContainer: document.getElementById('ar-hud')
    });

    //const video = document.getElementById('my-video');
    //const source = Martins.Source.Video(video);
    const source = Martins.Source.Camera();

    const session = await Martins.startSession({
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

When you enable low-power mode, the WebAR engine will target a framerate of 30. In many cases, this is still acceptable for a good user experience. I suggest you test both ways!

I emphasize that you are **not** required to enable low-power mode. Enable it if power consumption is an issue for you. If it isn't, you may also experiment with the `"high-performance"` mode.

!!! question "When should I use low-power mode?"

    If you're targeting mobile devices, test your WebAR experiences with low-power mode. If you decide that the lower framerate is still acceptable, keep the low-power mode in order to save battery life.

## Add multiple virtual scenes

You can add multiple reference images to the reference image database. Each of those images can correspond to a different virtual scene. The virtual scene that shows up depends on the target image that is being tracked.

Explore the API to see how you can have multiple virtual scenes in a single web page. Don't go overboard with this, though: the web page should load fast. Too much content may impact loading times. Keep your media files small and load your models asynchronously if possible.

## Publish your WebAR experiences

So far we've just created a static HTML page. Static pages are surprisingly easy to deploy. Any quality web hosting supports them. [Neocities](https://neocities.org/){ ._blank }, [Glitch](https://glitch.com/){ ._blank } and [GitHub Pages](https://pages.github.com/){ ._blank } are popular alternatives that let you host your WebAR experiences easily and for free. Your pages will be served over HTTPS, and that's important for webcam access!

!!! tip "Tip: use a QR code"

    If you intend to print your reference images and have them placed on, let's say, a wall somewhere, consider adding a [QR code](https://en.wikipedia.org/wiki/QR_code){ ._blank } nearby. The QR code should point to your website. Users can then just scan your QR code to open your WebAR experience. Easy! :wink:

!!! tip "Use the minified code"

    When deploying your WebAR experiences, make sure to include the minified `martins.min.js` file instead of the regular `martins.js`. The latter is suitable for development. The former, for production.

## Support my work

If you came this far in the guide, WebAR probably excites you. It is definitely something you want. I know, it is awesome! The possibilities are endless. Even better than getting your creative juices boiling with enthusiasm is the feeling of joy I have for sharing this work with you.

Do you want more WebAR? Help me bring you more! Creating this WebAR engine has been a **huge** personal effort that required time, skill and highly specialized knowledge. Please support my work, so that I'm able to continue it and make it even more awesome!

[:heart:{ .heart } Support my work](../support-my-work.md){ .md-button }