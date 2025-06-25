# ImageTracker

A [tracker](tracker.md) that tracks images in a video. Images are tracked using templates known as [reference images](reference-image.md).

!!! tip "Guidelines for Images"

    Read [Guidelines for Images](../guidelines-for-images.md) for tips on how to design images that are suitable for tracking.

## Instantiation

### AR.Tracker.Image

`AR.Tracker.Image(options: object): ImageTracker`

Instantiate an image tracker with the specified `options`.

*Since:* 0.4.0

**Arguments**

* `options: object, optional`. An object with the following keys (all are optional):
    * `resolution: Resolution`. The [resolution](resolution.md) of the tracker. Make sure that the [resolution of the video](camera-source.md#resolution) is at least as high as this. Suggested values: `"sm"`, `"sm+"`, `"md"`, `"md+"`.

**Returns**

A new image tracker.

**Example**

```js
const imageTracker = AR.Tracker.Image({
    resolution: "sm"
});
```

### AR.Tracker.ImageTracker

<span style="text-decoration: line-through">`AR.Tracker.ImageTracker(): ImageTracker`</span>

Instantiate an image tracker with the default settings.

*Deprecated since:* 0.4.0. Use `AR.Tracker.Image()` instead.

**Returns**

A new image tracker.

## Properties

### type

`tracker.type: string, read-only`

The string `"image-tracker"`.

### state

`tracker.state: string, read-only`

The current state of the tracker.

### database

`tracker.database: ReferenceImageDatabase, read-only`

A [database](reference-image-database.md) of [reference images](reference-image.md).

### resolution

`tracker.resolution: Resolution, read-only`

The [resolution](resolution.md) adopted by the computer vision algorithms implemented in the tracker. Higher resolutions improve the tracking quality, but are computationally more expensive. Note that this resolution is different from, and should not be larger than, the [resolution of the camera](camera-source.md#resolution)!

*Note:* this property is read-only since 0.4.0. Set the resolution when [instantiating](#instantiation) the tracker.

## Events

An ImageTracker is an [AREventTarget](ar-event-target.md). You can listen to the following events:

### targetfound

A target has been found.

**Properties**

* `referenceImage: ReferenceImage`. The [reference image](reference-image.md) that is linked to the target.

**Example**

```js
tracker.addEventListener('targetfound', event => {
    console.log('Found target: ' + event.referenceImage.name);
});
```

### targetlost

A target has been lost.

**Properties**

* `referenceImage: ReferenceImage`. The [reference image](reference-image.md) that is linked to the target.