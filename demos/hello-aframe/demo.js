/**
 * @file MARTINS.js WebAR demo using A-Frame
 * @version 1.0.2
 * @author Alexandre Martins (https://github.com/alemart)
 * @license LGPL-3.0-or-later
 */

async function startARSession(canvas)
{
    if(!Martins.isSupported()) {
        throw new Error(
            'Use a browser/device compatible with WebGL2 and WebAssembly. ' +
            'Your user agent is ' + navigator.userAgent
        );
    }

    if(!(canvas instanceof HTMLCanvasElement))
        throw new Error(`startARSession expects a <canvas>`);

    //Martins.Settings.powerPreference = 'low-power';

    const tracker = Martins.Tracker.ImageTracker();
    await tracker.database.add([{
        name: 'my-reference-image',
        image: document.getElementById('my-reference-image')
    }]);

    const viewport = Martins.Viewport({
        canvas: canvas,
        container: document.getElementById('ar-viewport'),
        hudContainer: document.getElementById('ar-hud')
    });

    //const useWebcam = true;
    const useWebcam = (location.search.substr(1) == 'webcam');
    const video = document.getElementById('my-video');
    const source = !useWebcam ? Martins.Source.Video(video) : Martins.Source.Camera();

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
        session.gizmos.visible = false;
        if(scan)
            scan.hidden = true;
    });

    tracker.addEventListener('targetlost', event => {
        session.gizmos.visible = true;
        if(scan)
            scan.hidden = false;
    });

    return session;
}

// Toggle webcam
window.addEventListener('load', () => {
    const page = location.href.replace(/\?.*$/, '');
    const usingWebcam = (location.search.substr(1) == 'webcam');
    const button = document.getElementById('toggle-webcam');

    if(!button)
        return;

    button.innerHTML = usingWebcam ? '&#x1F39E' : '&#x1F3A5';
    button.addEventListener('click', () => {
        if(usingWebcam)
            location.href = page;
        else
            location.href = page + '?webcam';
    });
});