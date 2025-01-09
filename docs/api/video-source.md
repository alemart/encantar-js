# VideoSource

A [source of data](source.md) linked to a `<video>` element.

## Instantiation

### AR.Source.Video

`AR.Source.Video(video: HTMLVideoElement): VideoSource`

Create a new source of data linked to the provided `video`.

**Arguments**

* `video: HTMLVideoElement`. A `<video>` element.

**Returns**

A new source of data.

## Properties

### video

`source.video: HTMLVideoElement, read-only`

The underlying `<video>` element.

*Since:* 0.4.1
