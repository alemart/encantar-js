# Quaternion

A number system used in encantar.js to represent rotations in 3D space.

*Since:* 0.4.0

## Properties

### x

`quaternion.x: number, read-only`

The x coordinate of the quaternion (imaginary).

### y

`quaternion.y: number, read-only`

The y coordinate of the quaternion (imaginary).

### z

`quaternion.z: number, read-only`

The z coordinate of the quaternion (imaginary).

### w

`quaternion.w: number, read-only`

The w coordinate of the quaternion (real).

## Methods

### length

`quaternion.length(): number`

Compute the magnitude of the quaternion.

**Returns**

The magnitude of the quaternion.

### equals

`quaternion.equals(q: Quaternion): boolean`

Check if `this` and `q` have the same coordinates.

**Arguments**

* `q: Quaternion`. A quaternion.

**Returns**

`true` if `this` and `q` have the same coordinates.

### toString

`quaternion.toString(): string`

Generate a string representation of the quaternion.

**Returns**

A string representation of the quaternion.
