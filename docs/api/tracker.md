# Tracker

An interface that represents a generic tracker. Trackers analyze input data in some way and are meant to be attached to a [session](session.md). Refer to the [concepts](../tutorial/concepts.md) for more information.

An [Image Tracker](image-tracker.md) is an implementation of a tracker, and so is a [PointerTracker](pointer-tracker.md).

## Properties

### type

`tracker.type: string, read-only`

A string representing the type of the tracker.

*Deprecated since:* 0.4.4. Use `tracker.is()` instead.

## Methods

### is

`tracker.is(type: string): boolean`

Checks if `this` tracker is of a certain `type`. This is a convenient type guard for TypeScript users. See also: [TrackerResult.of](./tracker-result.md#of).

*Since:* 0.4.4

**Returns**

`true` if and only if `type === tracker.type`

**Example**

```ts
let tracker: Tracker;

// ...

if(tracker.is('image-tracker')) {
    // tracker is inferred to be an ImageTracker
    // ...
}
else if(tracker.is('pointer-tracker')) {
    // tracker is inferred to be a PointerTracker
    // ...
}
else {
    // ...
}
```