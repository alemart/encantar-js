/**
 * encantar.js pointer demo
 * @license LGPL-3.0-or-later
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

(function() {

let displayMessage = true;

const POINTER_RADIUS = 50;
const POINTER_COLOR = 'red';
const PRIMARY_POINTER_COLOR = 'lime';
const BACKGROUND_COLOR = 'antiquewhite';
const TEXT_COLOR = 'black';
const TEXT_FONT = '36px sans-serif';
const TEXT_LARGE_FONT = '96px sans-serif';
const TEXT_LINE_HEIGHT = 40;
const TWO_PI = 2.0 * Math.PI;

/**
 * Render the virtual scene
 * @param {TrackablePointer[]} pointers
 * @param {Viewport} viewport
 * @returns {void}
 */
function render(pointers, viewport)
{
    /*

    Check out the API reference to see the various interesting properties of a
    TrackablePointer! They are useful for creating all sorts of interactive
    experiences!

    */

    // get the canvas context
    const canvas = viewport.canvas;
    const ctx = canvas.getContext('2d');

    if(!ctx)
        return;

    ctx.textAlign = 'center';

    // draw the background
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // display a message
    if(displayMessage) {
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = TEXT_LARGE_FONT;
        ctx.fillText('Tap to begin', canvas.width / 2, canvas.height / 2);

        if(pointers.length > 0)
            displayMessage = false;
    }

    // render the pointers
    for(const pointer of pointers) {
        // pointer.position is given in normalized units [-1,1]x[-1,1]
        // we convert it to pixel coordinates (canvas space)
        const position = viewport.convertToPixels(pointer.position);

        ctx.fillStyle = pointer.isPrimary ? PRIMARY_POINTER_COLOR : POINTER_COLOR;
        ctx.beginPath();
        ctx.arc(position.x, position.y, POINTER_RADIUS, 0, TWO_PI);
        ctx.fill();
    }

    // render the texts above the pointers
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = TEXT_FONT;
    for(const pointer of pointers) {
        const position = viewport.convertToPixels(pointer.position);
        position.y -= POINTER_RADIUS + 6 * TEXT_LINE_HEIGHT;

        ctx.fillText('id: ' + pointer.id, position.x, position.y + 0 * TEXT_LINE_HEIGHT);
        ctx.fillText(pointer.phase, position.x, position.y + 1 * TEXT_LINE_HEIGHT);
        ctx.fillText('x: ' + pointer.position.x.toFixed(5), position.x, position.y + 2 * TEXT_LINE_HEIGHT);
        ctx.fillText('y: ' + pointer.position.y.toFixed(5), position.x, position.y + 3 * TEXT_LINE_HEIGHT);
        ctx.fillText('speed: ' + pointer.velocity.length().toFixed(5), position.x, position.y + 4 * TEXT_LINE_HEIGHT);
        ctx.fillText('time: ' + pointer.duration.toFixed(5), position.x, position.y + 5 * TEXT_LINE_HEIGHT);
    }
}

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

    const viewport = AR.Viewport({
        resolution: '720p',
        container: document.getElementById('ar-viewport'),
        hudContainer: document.getElementById('ar-hud')
    });

    const tracker = AR.Tracker.Pointer();
    const source = AR.Source.Pointer();

    const session = await AR.startSession({
        mode: 'immersive',
        viewport: viewport,
        trackers: [ tracker ],
        sources: [ source ],
        stats: true,
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
    const pointers = read(frame);

    render(pointers, session.viewport);

    session.requestAnimationFrame(animate);
}

/**
 * Read the results of the tracker
 * @param {Frame} frame
 * @returns {TrackablePointer[]}
 */
function read(frame)
{
    for(const result of frame.results) {
        if(result.of('pointer-tracker')) {
            const pointers = result.trackables;
            return pointers;
        }
    }

    return [];
}

/**
 * Start the demo
 * @returns {void}
 */
function main()
{
    startARSession().then(session => {

        session.requestAnimationFrame(animate); // start the animation loop

    }).catch(error => {

        alert(error.message);

    });
}

document.addEventListener('DOMContentLoaded', main);

})();
