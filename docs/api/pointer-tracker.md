# PointerTracker

A [tracker](tracker.md) of [pointers](trackable-pointer.md). It consumes data from a [PointerSource](pointer-source.md) and produces [PointerTrackerResults](pointer-tracker-result.md).

*Since:* 0.4.0

## Instantiation

### AR.Tracker.Pointer

`AR.Tracker.Pointer(): PointerTracker`

Create a new `PointerTracker`.

**Returns**

A new `PointerTracker`.

**Example**

```js
const pointerTracker = AR.Tracker.Pointer();
```

## Properties

### type

`tracker.type: string, read-only`

The string `"pointer-tracker"`.