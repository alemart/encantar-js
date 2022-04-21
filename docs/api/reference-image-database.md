# ReferenceImageDatabase

A database of [reference images](reference-image.md) that belongs to an [Image Tracker](image-tracker.md).

## Properties

### count

`database.count: number, read-only`

The number of reference images stored in this database.

### capacity

`database.capacity: number, read-only`

The maximum number of reference images that can be stored in this database.

## Methods

### add

`database.add(referenceImages: ReferenceImage[]): SpeedyPromise<void>`

Add reference image(s) to the database.

**Arguments**

* `referenceImages: ReferenceImage[]`. The reference image(s) you want to add.

**Returns**

A promise that resolves as soon as the provided reference images are loaded and added to the database.

**Example**

```js
const referenceImages = [{
    name: 'my-first-image',
    image: document.getElementById('my-first-image')
}, {
    name: 'my-second-image',
    image: document.getElementById('my-second-image')
}];

tracker.database.add(referenceImages).then(() => {
    console.log('The images have been added to the database');
});
```

### @@iterator

`database[Symbol.iterator](): Iterator<ReferenceImage>`

This is used to iterate over the reference images stored in the database.

**Returns**

An iterator.

**Example**

```js
for(const referenceImage of tracker.database) {
    console.log(referenceImage.name);
}
```