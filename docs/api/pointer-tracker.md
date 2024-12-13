# PointerTracker

A [tracker](tracker.md) of [pointers](trackable-pointer.md). It consumes data from a [PointerSource](pointer-source.md) and produces [PointerTrackerResults](pointer-tracker-result.md).

*Since:* 0.4.0

## Instantiation

### AR.Tracker.Pointer

`AR.Tracker.Pointer(options: object): PointerTracker`

Create a new `PointerTracker` with the specified `options`.

**Arguments**

* `options: object, optional`. An object with the following keys (all are optional):
    * `space: string`. The [space](#space) in which pointers will be located. Defaults to `"normalized"`.

**Returns**

A new `PointerTracker`.

**Example**

```js
// Use default settings
const pointerTracker = AR.Tracker.Pointer();

// Track pointers in adjusted space
const pointerTracker = AR.Tracker.Pointer({ space: 'adjusted' });
```

## Properties

### type

`tracker.type: string, read-only`

The string `"pointer-tracker"`.

### space

`tracker.space: string, read-only`

The space in which pointers are located. You may set it when instantiating the tracker. Possible values: `"normalized"` or `"adjusted"`.

- In `"normalized"` space, pointers are located in [-1,1]x[-1,1]. The origin of the space is at the center of the [viewport](viewport.md). The x-axis points to the right and the y-axis points up. This is the default space.

- The `"adjusted"` space is similar to the normalized space, except that it is scaled so that it matches the [aspect ratio](viewport.md#aspectratio) of the viewport.

    Pointers in adjusted space are contained in normalized space, but unless the viewport is a square, one of their coordinates, x or y, will no longer range from -1 to +1. It will range from *-s* to *+s*, where *s = min(a, 1/a)*. In this expression, *a* is the aspect ratio of the viewport and *s* is less than or equal to 1.

    Selecting the adjusted space is useful for making sure that pointer speeds are equivalent in both axes and for preserving movement curves. Speeds are not equivalent and movement curves are not preserved by default because the normalized space is a square, whereas the viewport is a rectangle.
