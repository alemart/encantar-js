# Session

A central component of a WebAR experience. Read the [concepts](../tutorial/concepts.md) for more information.

## Instantiation

### AR.startSession

`AR.startSession(options: object): SpeedyPromise<Session>`

Start a new session.

**Arguments**

* `options: object`. Options object with the following keys:
    * `trackers: Tracker[]`. The [trackers](tracker.md) to be attached to the session.
    * `sources: Source[]`. The [sources of data](source.md) to be linked to the session.
    * `viewport: Viewport`. The [viewport](viewport.md) to be linked to the session.
    * `mode: string, optional`. Either `"immersive"` or `"inline"`. Defaults to `"immersive"`.
    * `gizmos: boolean, optional`. Whether or not to display the [gizmos](gizmos.md). Defaults to `false`.
    * `stats: boolean, optional`. Whether or not to display the stats panel. It's useful during development. Defaults to `false`.

**Returns**

A promise that resolves to a new Session object.

## Properties

### mode

`session.mode: string, read-only`

Session mode: either `"immersive"` or `"inline"`.

### ended

`session.ended: boolean, read-only`

Whether or not the session has been ended. See also: [end](#end).

*Since:* 0.3.0

### time

`session.time: TimeManager, read-only`

A reference to the [TimeManager](time-manager.md) of this session.

### gizmos

`session.gizmos: Gizmos, read-only`

A reference to the [Gizmos](gizmos.md) object.

### viewport

`session.viewport: Viewport, read-only`

A reference to the [Viewport](viewport.md) linked to this session.

### trackers

`session.trackers: Iterable<Tracker>, read-only`

The [trackers](tracker.md) that are attached to the session.

*Since:* 0.3.0

### sources

`session.sources: Iterable<Source>, read-only`

The [sources of data](source.md) that are linked to the session.

*Since:* 0.3.0

## Methods

### requestAnimationFrame

`session.requestAnimationFrame(callback: function): SessionRequestAnimationFrameHandle`

Schedules a call to the `callback` function, which is intended to update and render the virtual scene. Your `callback` function must itself call `session.requestAnimationFrame()` again in order to continue to update and render the virtual scene.

!!! info "Notes"

    `session.requestAnimationFrame()` is analogous to `window.requestAnimationFrame()`, but they are not the same! The former is a call to the WebAR engine, whereas the latter is a standard call to the web browser.

    This call will be ignored and an invalid handle will be returned if the session has been [ended](#ended) (*since 0.3.0*). Previously, it would raise an exception.

**Arguments**

* `callback: function`. A function that receives two parameters:
    * `time: DOMHighResTimeStamp`. Elapsed time, in milliseconds, since an arbitrary reference. This parameter is kept to mimic web standards, but its usage is discouraged. Prefer using `frame.session.time.elapsed` and `frame.session.time.delta` instead. These are especially useful for creating animations. See also: [TimeManager](time-manager.md).
    * `frame: Frame`. A [Frame](frame.md) holding the data you need to create the augmented scene.

**Returns**

A handle.

**Example**

```js
//
// This is the animation loop:
//

function animate(time, frame)
{
    // update and render the virtual scene
    // ...

    // repeat
    session.requestAnimationFrame(animate);
}

// start the animation loop
session.requestAnimationFrame(animate);
```

### cancelAnimationFrame

`session.cancelAnimationFrame(handle: SessionRequestAnimationFrameHandle): void`

Cancels an animation frame request.

**Arguments**

* `handle: SessionRequestAnimationFrameHandle`. A handle returned by `session.requestAnimationFrame()`. If the handle is invalid, this method does nothing.

### end

`session.end(): SpeedyPromise<void>`

Ends the session.

**Returns**

A promise that resolves as soon as the session is terminated.

## Events

A session is an [AREventTarget](ar-event-target.md). You can listen to the following events:

### end

The session has ended.

**Example**

```js
session.addEventListener('end', event => {
    console.log('The session has ended.');
});
```