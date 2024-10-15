# Resolution

A `Resolution` is a setting defined by a string. It is mapped to a size measured in pixels according to special rules. You may use it, for example, to change the resolution of a video captured by a webcam, to adjust the resolution of a video when it is processed by a tracker, or to set the rendering resolution of a virtual scene.

The table below shows examples of how resolution strings are converted to pixels:

| Resolution | 16:9 | 16:10 | 4:3 | Notes |
| ---------- | ---- | ----- | --- | ----- |
| `"xs"` | 214x120 | 192x120 | 160x120 | |
| `"xs+"` | 256x144 | 230x144 | 192x144 | 144p |
| `"sm"` | 426x240 | 384x240 | 320x240 | 240p |
| `"sm+"` | 512x288 | 460x288 | 384x288 | |
| `"md"` | 568x320 | 512x320 | 426x320 | |
| `"md+"` | 640x360 | 576x360 | 480x360 | 360p |
| `"lg"` | 854x480 | 768x480 | 640x480 | 480p |
| `"lg+"` | 1066x600 | 960x600 | 800x600 | |
| `"xl"` | 1280x720 | 1152x720 | 960x720 | 720p |
| `"xl+"` | 1366x768 | 1228x768 | 1024x768 | |
| `"xxl"` | 1600x900 | 1440x900 | 1200x900 | |
| `"xxl+"` | 1706x960 | 1536x960 | 1280x960 | |