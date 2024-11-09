# Vector2

A vector in 2D space.

*Since:* 0.4.0

## Properties

### x

`vector.x: number, read-only`

The x coordinate of the vector.

### y

`vector.y: number, read-only`

The y coordinate of the vector.

## Methods

### length

`vector.length(): number`

Compute the magnitude of the vector.

**Returns**

The magnitude of the vector.

### dot

`vector.dot(v: Vector2): number`

Compute the dot product of `this` and `v`.

**Arguments**

* `v: Vector2`. A vector.

**Returns**

The dot product of the vectors.

### distanceTo

`vector.distanceTo(v: Vector2): number`

Compute the distance between points `this` and `v`.

**Arguments**

* `v: Vector2`. A vector / point.

**Returns**

The distance between the points.

### directionTo

`vector.directionTo(v: Vector2): Vector2`

Compute a unit vector pointing to `v` from `this`.

**Arguments**

* `v: Vector2`. A vector.

**Returns**

A new unit vector pointing to `v` from `this`.

### clone

`vector.clone(): Vector2`

Clone the vector.

**Returns**

A new vector object with the same coordinates as `this`.

### equals

`vector.equals(v: Vector2): boolean`

Check if `this` and `v` have the same coordinates.

**Arguments**

* `v: Vector2`. A vector.

**Returns**

`true` if `this` and `v` have the same coordinates.

### toString

`vector.toString(): string`

Generate a string representation of the vector.

**Returns**

A string representation of the vector.
