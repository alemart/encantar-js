# Babylon.js plugin

Documentation of the [babylon.js](https://www.babylonjs.com){ ._blank } plugin. Study the [demos](../demos.md) for practical examples.

*Since:* 0.3.0

## Basics

### Lifecycle

The following diagram shows, in a simplified manner, the lifecycle of an AR experience. The rectangular blocks represent methods of your [ARDemo](#ardemo). Function [encantar](#encantar) starts the magic.

![Lifecycle of an AR experience](../img/lifecycle-plugin.png)

!!! tip

    Use event listeners to detect events such as [finding an image](./image-tracker.md#events) in a camera feed.

### encantar

`encantar(demo: ARDemo): Promise<ARSystem>`

The `encantar` function *enchants* a `demo`, meaning: it starts the [lifecycle](#lifecycle) of the AR experience.

**Arguments**

* `demo: ARDemo`. Your demo. See also: [ARDemo](#ardemo)

**Returns**

A promise that resolves to an [ARSystem](#arsystem) when the demo starts.

**Example**

```js
function main()
{
    const demo = new MyDemo(); // class MyDemo extends ARDemo

    encantar(demo).catch(error => {
        alert(error.message);
    });
}

document.addEventListener('DOMContentLoaded', main);
```

!!! note

    You should **not** call [session.requestAnimationFrame()](./session.md#requestanimationframe) when using this plugin. The plugin already calls it.

## ARDemo

`ARDemo` is the base class for Augmented Reality experiences. It's an abstract class, meaning that you must extend it. It operates within the [lifecycle](#lifecycle) of your AR experience. The plugin will call its methods and control the flow of the program. Simply call [encantar](#encantar) to start the magic!

### ar

`demo.ar: ARSystem | null, read-only`

A reference to the [ARSystem](#arsystem), or `null` if the demo hasn't been started yet. See also: [lifecycle](#lifecycle)

*Since:* 0.4.0

### startSession

`demo.startSession(): Promise<Session> | SpeedyPromise<Session>`

Start the AR [Session](session.md). This method receives no arguments. It's supposed to call [AR.startSession](session.md#instantiation) with the desired settings.

**Returns**

A promise that resolves to a Session.

!!! warning "Important"

    This is an abstract method. You **must** implement it.

!!! info "Fact"

    The tracking begins when the session is started.

### init

`demo.init(): void | Promise<void> | SpeedyPromise<void>`

Use this method to initialize your 3D scene. See also: [ar](#ar), [preload](#preload)

**Returns**

`undefined`, or a promise that resolves to `undefined`.

**Example**

```js
class MyDemo extends ARDemo
{
    // ...

    init()
    {
        const ar = this.ar;
        const scene = ar.scene;

        // initialize the scene
        // ...
    }

    // ...
}
```

!!! tip

    Load external assets in [preload](#preload). Method `init` shouldn't take too long to run because the session is already started. See also: [lifecycle](#lifecycle)

### update

`demo.update(): void`

Animation step, called during the animation loop. You may want to do something with [ar.session](#session) or [ar.frame](#frame).

**Example**

```js
class MyDemo extends ARDemo
{
    // ...

    update()
    {
        const ar = this.ar;
        const session = ar.session;
        const deltaTime = session.time.delta; // given in seconds

        // ...
    }

    // ...
}
```

### release

`release(): void`

Release resources soon after the AR session is ended.

### preload

`preload(): Promise<void> | SpeedyPromise<void>`

Preload resources before starting the AR session. See also: [init](#init), [startSession](#startsession)

*Since:* 0.4.0

**Returns**

A promise that resolves to `undefined`.

## ARSystem

`ARSystem` is a helper for creating Augmented Reality experiences. Access it via [ARDemo.ar](#ar).

### session

`ar.session: Session, read-only`

A reference to the AR [Session](session.md).

### frame

`ar.frame: Frame | null, read-only`

A reference to the current [Frame](frame.md). This will be `null` if the demo hasn't been started yet, or if the session has been ended. See also: [lifecycle](#lifecycle)

### viewer

`ar.viewer: Viewer | null, read-only`

A reference to the [Viewer](viewer.md). This will be `null` if the [frame](#frame) is `null`.

*Since:* 0.4.0

### pointers

`ar.pointers: TrackablePointer[], read-only`

An array of [TrackablePointers](trackable-pointer.md).

*Since:* 0.4.0

!!! tip

    Make sure to add a [PointerTracker](pointer-tracker.md) to your session in order to use these.

### root

`ar.root: BABYLON.TransformNode, read-only`

A node that is automatically aligned to the physical scene.

!!! warning "Important"

    In most cases, objects of your virtual scene should be descendants of this node!

### camera

`ar.camera: BABYLON.Camera, read-only`

A camera that is automatically adjusted for AR.

### scene

`ar.scene: BABYLON.Scene, read-only`

The babylon.js scene.

### engine

`ar.engine: BABYLON.Engine, read-only`

The babylon.js engine.

### utils

`ar.utils: ARUtils, read-only`

[Utilities](#arutils) object.

*Since:* 0.4.0

## ARUtils

Utilities object.

### convertVector2

`ar.utils.convertVector2(v: Vector2): BABYLON.Vector2`

Convert a [Vector2](./vector2.md) into a `BABYLON.Vector2`.

*Since:* 0.4.0

**Arguments**

* `v: Vector2`. A 2D vector.

**Returns**

A corresponding `BABYLON.Vector2`.

### convertVector3

`ar.utils.convertVector3(v: Vector3): BABYLON.Vector3`

Convert a [Vector3](./vector3.md) into a `BABYLON.Vector3`.

*Since:* 0.4.0

**Arguments**

* `v: Vector3`. A 3D vector.

**Returns**

A corresponding `BABYLON.Vector3`.

### convertQuaternion

`ar.utils.convertQuaternion(q: Quaternion): BABYLON.Quaternion`

Convert a [Quaternion](./quaternion.md) into a `BABYLON.Quaternion`.

*Since:* 0.4.0

**Arguments**

* `q: Quaternion`. A quaternion.

**Returns**

A corresponding `BABYLON.Quaternion`.

### convertRay

`ar.utils.convertRay(r: Ray): BABYLON.Ray`

Convert a [Ray](./ray.md) into a `BABYLON.Ray`.

*Since:* 0.4.0

**Arguments**

* `r: Ray`. A ray.

**Returns**

A corresponding `BABYLON.Ray`.
