# CanvasSource

A [source of data](source.md) linked to a `<canvas>` element.

## Instantiation

### AR.Source.Canvas

`AR.Source.Canvas(canvas: HTMLCanvasElement): CanvasSource`

Create a new source of data linked to the provided `canvas`.

**Arguments**

* `canvas: HTMLCanvasElement`. A `<canvas>` element.

**Returns**

A new source of data.

## Properties

### canvas

`source.canvas: HTMLCanvasElement, read-only`

The underlying `<canvas>` element.

*Since:* 0.4.4