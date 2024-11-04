# TrackablePointer

A [trackable](trackable.md) that represents a pointer tracked by a [PointerTracker](pointer-tracker.md).

A pointer is an abstraction that represents an instance of user input that targets one or more coordinates on a screen. For example, each point of contact between fingers and a multitouch screen generate a pointer. Devices such as a mouse and a pen/stylus also generate pointers.

Pointers are positioned in the [viewport](viewport.md). Their positions are given in normalized units, which range from -1 to +1. The center of the viewport is at (0,0). The top right corner is at (1,1). The bottom left corner is at (-1,-1).

*Since:* 0.4.0

## Properties

### id

`pointer.id: number, read-only`

A unique identifier assigned to this pointer.

### phase

`pointer.phase: string, read-only`

The phase of the pointer. It's one of the following strings:

* `"began"`: the tracking began in this frame (e.g., a finger has just touched the screen)
* `"stationary"`: the user did not move the pointer in this frame
* `"moved"`: the user moved the pointer in this frame
* `"ended"`: the tracking ended in this frame (e.g., a finger has just been lifted from the screen)
* `"canceled"`: the tracking was canceled in this frame (e.g., the screen orientation of the device has just been changed)

### position

`pointer.position: Vector2, read-only`

The current position of the pointer, given in normalized units. See also: [Viewport.convertToPixels](viewport.md#converttopixels).

### initialPosition

`pointer.initialPosition: Vector2, read-only`

The position of the pointer when its tracking began.

### deltaPosition

`pointer.deltaPosition: Vector2, read-only`

The difference between the position of the pointer in this and in the previous frame.

### velocity

`pointer.velocity: Vector2, read-only`

The current velocity of the pointer, given in normalized units per second. You can get the speed of motion by calculating the [magnitude](vector2.md#length) of this vector.

### isPrimary

`pointer.isPrimary: boolean, read-only`

Whether or not this is the primary pointer among all pointers of this [type](#type). A typical primary pointer is that of a finger that touches the screen when no other fingers are touching it.

### type

`pointer.type: string, read-only`

The type of device that originated this pointer. Typically `"touch"`, `"mouse"` or `"pen"`.
