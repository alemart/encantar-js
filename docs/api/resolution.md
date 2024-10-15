# Resolution

A `Resolution` is a setting defined by a string. It is mapped to a size measured in pixels according to special rules. You may use it, for example, to change the resolution of a video captured by a webcam, to adjust the resolution of a video when it is processed by a tracker, or to set the resolution of the virtual scene when it is rendered.

The table below shows examples of how resolution strings are converted to pixels:

| Resolution | 16:9 landscape | 16:10 landscape | 4:3 landscape | Notes |
| ---------- | -------------- | --------------- | ------------- | ----- |
| `"xs"` | 214x120 | 192x120 | 160x120 | |
| `"xs+"` | 284x160 | 256x160 | 214x160 | |
| `"sm"` | 356x200 | 320x200 | 266x200 | |
| `"sm+"` | 426x240 | 384x240 | 320x240 | 240p |
| `"md"` | 568x320 | 512x320 | 426x320 | |
| `"md+"` | 640x360 | 576x360 | 480x360 | 360p |
| `"lg"` | 854x480 | 768x480 | 640x480 | 480p |
| `"lg+"` | 1066x600 | 960x600 | 800x600 | |
| `"xl"` | 1280x720 | 1152x720 | 960x720 | 720p |
| `"xl+"` | 1366x768 | 1228x768 | 1024x768 | |
| `"xxl"` | 1600x900 | 1440x900 | 1200x900 | |
| `"xxl+"` | 1706x960 | 1536x960 | 1280x960 | 960p |