/**
 * @file MARTINS.js WebAR Multiple Image Targets demo with A-Frame
 * @author Alexandre Martins (https://github.com/alemart)
 * @license LGPL-3.0-or-later
 */

async function startARSession(canvas)
{
    if(!Martins.isSupported()) {
        throw new Error(
            'This device is not compatible with this AR experience.\n\n' +
            'User agent: ' + navigator.userAgent
        );
    }

    if(!(canvas instanceof HTMLCanvasElement))
        throw new Error(`startARSession expects a <canvas>`);

    //Martins.Settings.powerPreference = 'low-power';

    const tracker = Martins.Tracker.ImageTracker();
    await tracker.database.add([
    {
        name: 'my-reference-image',
        image: document.getElementById('my-reference-image')
    },
    {
        name: 'my-reference-image2',
        image: document.getElementById('my-reference-image2')
    },
    ]);

    const viewport = Martins.Viewport({
        canvas: canvas,
        container: document.getElementById('ar-viewport'),
        hudContainer: document.getElementById('ar-hud')
    });

    const video = document.getElementById('my-video');
    const useWebcam = (video === null);
    const source = useWebcam ?
        Martins.Source.Camera({ resolution: 'md' }) :
        Martins.Source.Video(video);

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
