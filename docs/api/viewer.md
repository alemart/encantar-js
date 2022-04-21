# Viewer

A virtual camera in 3D world space.

## Properties

### pose

`viewer.pose: ViewerPose, read-only`

The [pose](viewer-pose.md) of the viewer.

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