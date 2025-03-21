# Video Player

An A-Frame component and primitive for playing videos in AR. `<ar-video-player>` is tailored for encantar.js. Unlike the standard `<a-video>`, `<ar-video-player>` handles corner cases for AR and includes easy-to-use controls, so you can focus on your projects rather than dealing with technicalities and quirks of video playback in the browser.

!!! tip "It's easy to use!"

    The Video Player Add-On includes a working demo that you can easily modify. This page documents it in depth and is meant to be used as a reference.

<link rel="stylesheet" href="../../style/lite-yt-embed.css">
<script src="../../js/lite-yt-embed.js"></script>
<lite-youtube videoid="sz4Fmf3zyho"></lite-youtube>

## Properties

| Property | Description | Default |
| -------- | ----------- | ------- |
| `src` | Query selector of a `<video>` element. | `""` |
| `autoplay` | Whether or not the video should play as soon as the target is found. When enabling autoplay, your `<video>` element should be muted in order to comply with [browser policies](#autoplay). *Since:* 1.1.0 | `false` |
| `width` | Width of the player. | `2` |
| `height` | Height of the player. | `1.125` |

!!! tip

    Place your `<video>` tag(s) inside `<a-assets>`:

    ```html
    <ar-root>
        <ar-video-player src="#my-video">
            <!-- ... video controls ... -->
        </ar-video-player>
    </ar-root>

    <!-- ... -->

    <a-assets>
        <video id="my-video" playsinline>
            <source src="assets/my-video.mp4" type="video/mp4" />
            <source src="assets/my-video.webm" type="video/webm" />
        </video>
    </a-assets>
    ```

!!! info "Aspect ratio"

    Make sure that the `width` and the `height` of your `<ar-video-player>` match the aspect ratio of your video. The default size is appropriate for the commonly used 16:9 widescreen ratio.

## Video controls

### Overview

You may attach the `ar-video-control` component to any [AR Button](./ar-button.md) (typically) or to any [AR Clickable](./ar-clickable.md) (in general) in order to let the user control the video with a click. What exactly happens with a click depends on the selected [action](#actions).

Add the `ar-video-control` component to a descendant of `<ar-video-player>` as in this example:

```html
<ar-video-player src="#my-video">

    <!-- The play button is placed inside ar-video-player -->
    <ar-button id="play-button" position="0 -0.9 0"
        ar-video-control="action: play"
    ></ar-button>

</ar-video-player>
```

### Properties

| Property | Description | Default |
| -------- | ----------- | ------- |
| `action` | The [action](#actions) to be performed. | `""` |

### Actions

| Action | Description |
| ------ | ----------- |
| `"play"` | Play the video. |
| `"pause"` | Pause the video. |
| `"toggle"` | Toggle the video playback. |
| `"stop"` | Pause and rewind the video. |
| `"rewind"` | Rewind the video without pausing it. |
| `"mute"` | Mute the video. |
| `"unmute"` | Unmute the video. |
| `"toggleAudio"` | Toggle the audio. |
| `""` | Do nothing. |

## Multiple videos

You may play different videos depending on the target that is being tracked. This can be accomplished by setting an `<ar-video-player-source>` for each reference image:

```html
<ar-root>
    <ar-video-player width="2" height="1.125">

        <!-- Set different videos for different targets -->
        <ar-video-player-source reference-image="mage" src="#mage-video"></ar-video-player-source>
        <ar-video-player-source reference-image="cat" src="#cat-video"></ar-video-player-source>

    </ar-video-player>
</ar-root>
```

*Since:* 1.1.0

### Properties

| Property | Description | Default |
| -------- | ----------- | ------- |
| `reference-image` | The name of a [reference image](../api/plugin-aframe.md#ar-reference-image). | `""` |
| `src` | Query selector of a `<video>` element. | `""` |

## Declarative handlers

### Overview

Declarative event handlers are components used to register event listeners that set properties. They provide an easy way to create interactivity within your HTML page. There is a component for each [event](#events):

| Handler | Description |
| ------- | ----------- |
| `ar-onvideoplay` | Triggered when the video is played. |
| `ar-onvideopause` | Triggered when the video is paused. |
| `ar-onvideoended` | Triggered when the video reaches its end. |

These handlers can be added to `<ar-video-player>` itself or to any of its descendants:

```html
<!-- Make the video player translucent when not playing a video -->
<ar-video-player src="#my-video" transparent="true" opacity="0.5"
    ar-onvideoplay="opacity: 1"
    ar-onvideopause="opacity: 0.5"
    ar-onvideoended="opacity: 0.5"
>
    <!-- ... video controls ... -->
</ar-video-player>
```

[Video controls](#video-controls) may be combined with declarative handlers for easy customization:

```html
<!-- Make the pause button appear when the video starts playing.
     Make it disappear when the video ends or is paused. -->
<ar-video-player src="#my-video">

    <!-- The pause button is placed inside ar-video-player -->
    <ar-button id="pause-button" position="0 -0.9 0"
        visible="false" enabled="false"
        ar-onvideoplay="visible: true; ar-button.enabled: true"
        ar-onvideopause="visible: false; ar-button.enabled: false"
        ar-onvideoended="visible: false; ar-button.enabled: false"
        ar-video-control="action: pause"
    ></ar-button>

</ar-video-player>
```

### Special properties

The following special properties are used to further customize the declarative handlers:

| Property | Description |
| -------- | ----------- |
| `_target` | Query selector to be used when setting properties on a different entity. |
| `_delay` | Delay, in milliseconds, before setting the properties. |

!!! question "What about event-set?"

    Declarative handlers are similar to A-Frame's event-set in their usage, but there are differences behind the scenes. Whenever working with the Video Player, usage of the declarative handlers presented in this page is recommended.

### Multiple handlers

Use double-underscores (`__`) to attach multiple handlers of the same type to a single entity:

```html
<!-- Make two animated characters show up as soon as the video reaches its end -->
<ar-video-player src="#my-video"
    ar-onvideoended__1="_target: #animated-character-1; visible: true"
    ar-onvideoended__2="_target: #animated-character-2; visible: true"
>
    <!-- ... video controls ... -->
</ar-video-player>

<!-- ... -->

<a-entity id="animated-character-1" visible="false" ... ></a-entity>
<a-entity id="animated-character-2" visible="false" ... ></a-entity>
```

## Events

The `<ar-video-player>` emits the following events based on the state of the underlying `<video>` element:

| Event name | Description |
| ---------- | ----------- |
| `"videoplay"` | Triggered whenever the video is played. |
| `"videopause"` | Triggered whenever the video is paused. |
| `"videoended"` | Triggered whenever the video reaches its end. |

## Methods

| Method | Description |
| ------ | ----------- |
| `invoke(action)` | Perform an [action](#actions). |

## Autoplay

Due to browser policies, there are restrictions to be aware of when using autoplay:

* Usage of the [autoplay](#properties) setting on `<ar-video-player>` should be accompanied by a `muted` attribute on the `<video>` tag. If the page receives no user interaction, then you may only play your video automatically if it's effectively muted.
* Usage of the `autoplay` attribute on the `<video>` tag is discouraged. Video playback may be blocked. In addition, the Video Player will not show up in AR at the exact moment the page is loaded.
* Ponder whether or not playing an initially muted video makes sense for your project. It may be better to wait for user input in order to initiate the playback, e.g., have the user click on a play button. If you decide to use autoplay, have a [unmute button](#video-controls) nearby.

*Example*

```html
<ar-root>
    <ar-video-player src="#my-video" autoplay="true">
        <!-- ... video controls ... -->
    </ar-video-player>
</ar-root>

<!-- ... -->

<a-assets>
    <!-- Notice the muted attribute -->
    <video id="my-video" playsinline muted>
        <source src="assets/my-video.mp4" type="video/mp4" />
        <source src="assets/my-video.webm" type="video/webm" />
    </video>
</a-assets>
```
