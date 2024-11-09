# Transform

A Transform represents a position, a rotation and a scale in 3D space.

## Properties

### matrix

`transform.matrix: SpeedyMatrix, read-only`

A 4x4 matrix encoding the transform.

### inverse

`transform.inverse: Transform, read-only`

The inverse transform.

## position

`transform.position: Vector3, read-only`

The 3D position encoded by the transform.

*Since:* 0.4.0

## orientation

`transform.orientation: Quaternion, read-only`

A unit [quaternion](quaternion.md) describing the rotational component of the transform.

*Since:* 0.4.0

## scale

`transform.scale: Vector3, read-only`

The scale encoded by the transform.

*Since:* 0.4.0

## right

`transform.right: Vector3, read-only`

The unit right vector of the local space.

*Since:* 0.4.0

## up

`transform.up: Vector3, read-only`

The unit up vector of the local space.

*Since:* 0.4.0

## forward

`transform.forward: Vector3, read-only`

The unit forward vector of the local space.

*Since:* 0.4.0