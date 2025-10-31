# Take Photos

Make your WebAR experiences memorable! Simply drop `<ar-snapshot-button>` into your web page, and your users will be able to take photos with AR content just by tapping a button, as in a camera app. Photos can be downloaded, shared among friends on social media, and more!

<link rel="stylesheet" href="../../style/lite-yt-embed.css">
<script src="../../js/lite-yt-embed.js"></script>
<lite-youtube videoid="_mCskPWLBl8"></lite-youtube>

<div style="text-align:center" markdown>
[I want this Add-On!](https://ko-fi.com/s/513dcaf94a){ .md-button .md-button--primary ._blank }
</div>

## Overview

The Add-On includes a working example, but here is how it works in a nutshell:

```html hl_lines="5-6"
...
<ar-viewport>
    <ar-hud>

        <!-- Just plug & play! -->
        <ar-snapshot-button></ar-snapshot-button>

        ...

    </ar-hud>
</ar-viewport>
...
```

## Properties

| Property | Description | Default |
| -------- | ----------- | ------- |
| `action` | The [action](#actions) to be performed when the button is pressed. | `"download"` |
| `filename` | The desired filename of the snapshot. Valid extensions: png, jpg, jpeg. Browsers treat this name only as a suggestion. | `"snapshot.png"` |
| `resolution` | The [resolution](../api/resolution.md) of the snapshot. | `"720p"` |

## Actions

| Action | Description |
| ------ | ----------- |
| `"download"` | Download snapshots to the device. See also: [Dynamic filenames](#dynamic-filenames). |
| `"popup"` | Display snapshots in a new window or tab, without saving them. |
| `"none"` | Do nothing. This action may be useful when implementing custom behaviors with [events](#events). |

## Events

| Event name | Description | Fields of `event.custom` |
| ---------- | ----------- | ------------------------ |
| `"arsnapshotready"` | A new snapshot is ready. | `file`: the snapshot represented as a [File](https://developer.mozilla.org/en-US/docs/Web/API/File){ ._blank } object. <br> `ar`: a reference to the [AR System](../api/plugin-aframe.md#ar-system). |

## Customization

### Changing the visuals

The button is a circular graphic, a standard in camera apps. It may be customized by changing a CSS file that accompanies the demo.

### Playing sounds

Use the `sound` component of A-Frame to make your button play a sound when it's pressed:

```html
<ar-snapshot-button sound="src: #button-sound"></ar-snapshot-button>

...

<a-assets>
    <audio id="button-sound" src="click.wav" preload="auto"></audio>
    ...
</a-assets>
```

## Troubleshooting

### CORS

Make sure that the viewport canvas is not [tainted](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image){ ._blank } due to cross-origin issues. If possible, load your page and your assets from the [same origin](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy){ ._blank }.

### Dynamic filenames

When downloading photos to the device, you may want to avoid [filename](#properties) clashes. Downloads are treated differently across browsers. When a filename clash occurs, some browsers automatically rename the new file. Others do not, and ask if the user wants to replace the previous file. You may find this behavior undesirable for a camera app. We can avoid clashes by listening to [events](#events):

```html
<script>(function () {

// use localStorage for persistent IDs, or a Date for unique IDs
let nextId = 1; // Date.now();

// dynamically change the filename
document.addEventListener('arsnapshotready', function(event) {

    const button = event.target;
    const newFilename = generateFilename();

    button.setAttribute('filename', newFilename);

});

// check out the docs of the A-Frame plugin for details on 'arready'
document.addEventListener('arready', function() {

    const button = document.querySelector('ar-snapshot-button');
    const newFilename = generateFilename();

    button.setAttribute('filename', newFilename);

});

// generate a new filename
function generateFilename()
{
    const id = nextId++;
    return `snapshot${id}.png`;
}

})();</script>
```
