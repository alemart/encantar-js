# CameraSource

A [source of data](source.md) linked to a webcam. This class extends [VideoSource](video-source.md).

## Instantiation

### AR.Source.Camera

`AR.Source.Camera(settings: object): CameraSource`

Create a new webcam-based source of data with the specified `settings`.

**Arguments**

* `settings: object, optional`. An object with the following keys (all are optional):
    * `resolution: Resolution`. The desired [resolution](resolution.md) of the video. The higher the resolution, the longer it takes for the video to be uploaded to the GPU, which impacts performance. The lower the resolution, the less accurate the tracking will be. Suggested values: `"md+"`, `"md"`, `"sm+"`, `"sm"`.
    * `aspectRatio: number`. A hint specifying the preferred aspect ratio of the video.
    * `constraints: MediaTrackConstraints`. Additional video constraints that will be passed to `navigator.mediaDevices.getUserMedia()`.

!!! tip "Landscape × Portrait"

    You generally do not need to specify an `aspectRatio`, as encantar.js uses a suitable default. When customizing this setting, pick standard values for landscape mode such as `16/9` or `4/3`. Pick such values even if mobile devices are expected to be in portrait mode. Using arbitrary numbers is discouraged and may produce unexpected results in different devices.

**Returns**

A new webcam-based source of data.

**Example**

```js
const webcam = AR.Source.Camera({
    resolution: 'md+',
    constraints: {
        facingMode: 'environment' // will prefer the rear camera on mobile devices
        //facingMode: 'user' // will prefer the front camera on mobile devices
    }
});
```

## Properties

### resolution

`source.resolution: Resolution, read-only`

The [resolution](resolution.md) of this source of data. Set it when [instantiating](#instantiation) the object.
