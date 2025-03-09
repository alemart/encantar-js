# More Add-Ons

Documentation of A-Frame components bundled with the core.

## ar-scan-gimmick

Use `ar-scan-gimmick` to display an image in the [HUD](../api/hud.md) while the physical scene is being scanned (i.e., before an image target is tracked). Make sure to add the entity to [ar-hud](../api/plugin-aframe.md#ar-hud).

*Example*

```html
<ar-viewport>
  <ar-hud>

    <!-- ar-scan-gimmick is part of the HUD -->
    <ar-scan-gimmick></ar-scan-gimmick>

  </ar-hud>
</ar-viewport>
```

### Properties

| Property | Description | Default |
| -------- | ----------- | ------- |
| `opacity` | Opacity value. | `1` |
| `src` | URL of an image. If none is provided, a default image is used. | `""` |

## gltf-anim

An easy-to-use component for animating 3D models.

*Example*

```html
<!-- Animate a 3D model in AR -->
<ar-root>
  <a-entity gltf-model="#mage-model" gltf-anim="clip: Idle"></a-entity>
</ar-root>
```

### Properties

| Property | Description | Default |
| -------- | ----------- | ------- |
| `clip` | The name of an animation clip. | `""` |
| `loop` | Whether or not the animation should loop. | `true` |
| `speed` | Multiplier of the playback speed. | `1` |
| `transitionDuration` | Duration, in seconds, of transitions between clips. | `0` |
