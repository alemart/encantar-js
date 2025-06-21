/**
 * Augmented Reality template using encantar.js
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

(function() {

/**
 * Start the AR session
 * @returns {Promise<Session>}
 */
async function startARSession()
{
    if(!AR.isSupported()) {
        throw new Error(
            'This device is not compatible with this AR experience.\n\n' +
            'User agent: ' + navigator.userAgent
        );
    }

    const tracker = AR.Tracker.Image();
    await tracker.database.add([
    {
        name: 'mage',
        image: document.getElementById('mage')
    },
    {
        name: 'cat',
        image: document.getElementById('cat')
    }
    ]);

    const viewport = AR.Viewport({
        container: document.getElementById('ar-viewport'),
        hudContainer: document.getElementById('ar-hud')
    });

    const video = document.getElementById('my-video');
    const useWebcam = (video === null);
    const source = useWebcam ? AR.Source.Camera() : AR.Source.Video(video);

    const session = await AR.startSession({
        mode: 'immersive',
        viewport: viewport,
        trackers: [ tracker ],
        sources: [ source ],
        stats: true,
        gizmos: true,
    });

    const scan = document.getElementById('scan');
    if(scan)
        scan.style.pointerEvents = 'none';

    tracker.addEventListener('targetfound', event => {
        if(scan)
            scan.hidden = true;

        console.log('Target found: ' + event.referenceImage.name);
    });

    tracker.addEventListener('targetlost', event => {
        if(scan)
            scan.hidden = false;

        console.log('Target lost: ' + event.referenceImage.name);
    });

    return session;
}

/**
 * Animation loop
 * @param {number} time
 * @param {Frame} frame
 * @returns {void}
 */
function animate(time, frame)
{
    const session = frame.session;
    const deltaTime = session.time.delta; // given in seconds

    mix(frame);

    session.requestAnimationFrame(animate);
}

/**
 * Blend the physical and the virtual scenes
 * @param {Frame} frame
 * @returns {boolean} true if an image is being tracked
 */
function mix(frame)
{
    for(const result of frame.results) {
        if(result.tracker.is('image-tracker')) {
            if(result.trackables.length > 0) {
                const trackable = result.trackables[0];
                const projectionMatrix = result.viewer.view.projectionMatrix;
                const viewMatrix = result.viewer.pose.viewMatrix;
                const modelMatrix = trackable.pose.transform.matrix;

                doSomethingWith(projectionMatrix, viewMatrix, modelMatrix);
                return true;
            }
        }
    }

    return false;
}

/**
 * Template function
 * @param {SpeedyMatrix} projectionMatrix
 * @param {SpeedyMatrix} viewMatrix
 * @param {SpeedyMatrix} modelMatrix
 * @returns {void}
 */
function doSomethingWith(projectionMatrix, viewMatrix, modelMatrix)
{
    /*
    console.log('projectionMatrix', projectionMatrix.toString());
    console.log('viewMatrix', viewMatrix.toString());
    console.log('modelMatrix', modelMatrix.toString());
    */
}

/**
 * Start the Demo
 * @returns {void}
 */
function main()
{
    startARSession().then(session => {

        const canvas = session.viewport.canvas; // render your virtual scene on this <canvas>

        session.requestAnimationFrame(animate); // start the animation loop

    }).catch(error => {

        alert(error.message);

    });
}

document.addEventListener('DOMContentLoaded', main);

})();
