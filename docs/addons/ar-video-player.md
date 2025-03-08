# Video Player

An A-Frame solution for playing videos in AR. `<ar-video-player>` is tailored for AR with encantar.js. Unlike A-Frame's standard `<a-video>`, `<ar-video-player>` handles corner cases for AR and includes easy-to-use controls, so you can focus on creating your projects rather than dealing with the various technicalities and edge cases of video playback on the browser.

<div style="text-align: center">
<iframe width="560" height="315" src="https://www.youtube.com/embed/sz4Fmf3zyho?si=e4Ry5jcYAvxPfAKe" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

!!! tip "It's easy to use!"

    The Video Player Add-On includes a working demo that you can easily modify. This page documents it in depth and is meant to be used as a reference.

## Properties

| Property | Description | Default |
| -------- | ----------- | ------- |
| `src` | Query selector of a `<video>` element. | `""` |
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

!!! tip "Aspect ratio"

    Make sure that the `width` and the `height` of your `<ar-video-player>` match the aspect ratio of your video. The default size is appropriate for the commonly used 16:9 widescreen ratio.

## Video controls

### Overview

You may attach the `ar-video-control` component to any [AR Button](./ar-button.md) (typically) or to any [AR Clickable](./ar-clickable.md) (in general) in order to let the user control the video with a click. What exactly happens with a click depends on the selected [action](#actions).

Add the `ar-video-control` component to a descendant of `<ar-video-player>` as in this example:

```html
<ar-video-player src="#my-video">

    <!-- The play button is a descendant of ar-video-player -->
    <ar-button id="play-button" position="0 0.9 0"
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

## Declarative handlers

### Overview

Declarative event handlers are components used to register event listeners that set properties. They provide an easy way to create interactivity within your HTML page. There is a component for each [event](#event):

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

    <!-- The pause button is a descendant of ar-video-player -->
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

    Declarative handlers are similar to A-Frame's event-set in their usage, but there are differences behind the scenes. Whenever working with the Video Player, usage of the declarative handlers presented in this page is preferred.

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
| `invoke(action)` | Perform an [action](#video-controls). |

## Autoplay

Usage of the `autoplay` attribute on the `<video>` tag is discouraged. Video playback may be blocked due to browser policies and the Video Player will not show up in AR as soon as the page is loaded. It's typically better to wait for user input in order to initiate the playback, e.g., have the user click on a play button. If the page receives no user interaction, then you may still play your video as long as it's muted. See also: [artargetfound](../api/plugin-aframe.md#artargetfound) event.