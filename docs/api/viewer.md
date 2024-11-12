# Viewer

A virtual camera in 3D world space.

## Properties

### pose

`viewer.pose: ViewerPose, read-only`

The [pose](viewer-pose.md) of the viewer.

### transform

`viewer.transform: Transform, read-only`

The [Transform](transform.md) of the viewer. The same as `pose.transform`.

*Since:* 0.4.0

### view

`viewer.view: View, read-only`

A [view](view.md) of the viewer (monoscopic rendering).

## Methods

### convertToViewerSpace

`viewer.convertToViewerSpace(pose: Pose): Pose`

Convert a `pose` from world space to viewer space.

**Arguments**

* `pose: Pose`. A [pose](pose.md) in world space.

**Returns**

The input `pose` converted to viewer space.

**Example**

```js
const modelViewMatrix = viewer.convertToViewerSpace(pose).transform.matrix;
```

### raycast

`viewer.raycast(position: Vector2): Ray`

Cast a [ray](ray.md) from a point in the image space associated with this viewer.

*Since:* 0.4.0

**Arguments**

* `position: Vector2`. A point in image space, given in [normalized units](trackable-pointer.md).

**Returns**

A ray in world space that corresponds to the given point.

### forwardRay

`viewer.forwardRay(): Ray`

Compute a [ray](ray.md) in the forward direction from the viewer.

*Since:* 0.4.0

**Returns**

A new ray in world space.