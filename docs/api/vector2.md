# Vector2

A vector in 2D space.

*Since:* 0.4.0

## Instantiation

### AR.Vector2

`AR.Vector2(x: number, y: number): Vector2`

Create a new vector with the provided coordinates.

**Arguments**

* `x: number`. x coordinate.
* `y: number`. y coordinate.

**Returns**

A new vector.

**Example**

```js
const zero = AR.Vector2(0, 0);
```

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

### normalized

`vector.normalized(): Vector2`

Compute a unit vector with the same direction as `this`.

**Returns**

A new unit vector with the same direction as `this`.

### plus

`vector.plus(v: Vector2): Vector2`

Compute the sum between `this` vector and `v`.

**Arguments**

* `v: Vector2`. A vector.

**Returns**

A new vector equal to the sum between `this` and `v`.

### minus

`vector.minus(v: Vector2): Vector2`

Compute the difference between `this` vector and `v`.

**Arguments**

* `v: Vector2`. A vector.

**Returns**

A new vector equal to the difference `this` - `v`.

### times

`vector.times(scale: number): Vector2`

Compute `this` vector multiplied by a scale factor.

**Arguments**

* `scale: number`. A scale factor.

**Returns**

A new vector equal to the multiplication between `this` and the scale factor.

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
