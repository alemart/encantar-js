# ReferenceImage

An interface specifying an image template that is fed to an [Image Tracker](image-tracker.md).

## Properties

### name

`referenceImage.name: string, read-only`

A name used to identify this reference image in a [database](reference-image-database.md).

### image

`referenceImage.image: HTMLImageElement | ImageBitmap | ImageData, read-only`

Image template with pixel data.

*Note:* `ImageData` is acceptable since version 0.4.0.