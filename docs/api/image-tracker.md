# ImageTracker

A [tracker](tracker.md) that tracks images in a video. Images are tracked using templates known as [reference images](reference-image.md).

## Instantiation

### AR.Tracker.ImageTracker

`AR.Tracker.ImageTracker(): ImageTracker`

Instantiate an image tracker.

**Returns**

A new image tracker.

**Example**

```js
const imageTracker = AR.Tracker.ImageTracker();
```

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

`tracker.resolution: Resolution`

The [resolution](resolution.md) adopted by the computer vision algorithms implemented in the tracker. Higher resolutions improve the tracking quality, but are computationally more expensive. Note that this resolution is different from, and should not be larger than, the [resolution of the camera](camera-source.md#resolution)!

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