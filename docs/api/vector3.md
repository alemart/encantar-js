# Vector3

A vector in 3D space.

*Since:* 0.4.0

## Properties

### x

`vector.x: number, read-only`

The x coordinate of the vector.

### y

`vector.y: number, read-only`

The y coordinate of the vector.

### z

`vector.z: number, read-only`

The z coordinate of the vector.

## Methods

### length

`vector.length(): number`

Compute the magnitude of the vector.

**Returns**

The magnitude of the vector.

### dot

`vector.dot(v: Vector3): number`

Compute the dot product of `this` and `v`.

**Arguments**

* `v: Vector3`. A vector.

**Returns**

The dot product of the vectors.

### distanceTo

`vector.distanceTo(v: Vector3): number`

Compute the distance between points `this` and `v`.

**Arguments**

* `v: Vector3`. A vector / point.

**Returns**

The distance between the points.

### directionTo

`vector.directionTo(v: Vector3): Vector3`

Compute a unit vector pointing to `v` from `this`.

**Arguments**

* `v: Vector3`. A vector.

**Returns**

A new unit vector pointing to `v` from `this`.

### cross

`vector.cross(v: Vector3): Vector3`

Compute the cross product of `this` and `v`.

**Arguments**

* `v: Vector3`. A vector.

**Returns**

The cross product `this` x `v`.

### equals

`vector.equals(v: Vector3): boolean`

Check if `this` and `v` have the same coordinates.

**Arguments**

* `v: Vector3`. A vector.

**Returns**

`true` if `this` and `v` have the same coordinates.

### toString

`vector.toString(): string`

Generate a string representation of the vector.

**Returns**

A string representation of the vector.
