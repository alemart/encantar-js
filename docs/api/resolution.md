# Resolution

A `Resolution` is a setting defined by a string. It is mapped to a size measured in pixels according to special rules. You may use it to change the resolution in pixels of a video captured by a webcam, or to adjust the resolution in pixels of the videos that are processed by a tracker for example.

The table below shows examples of how resolution strings are converted to pixels:

| Resolution string | 16:9 landscape | 16:10 landscape | 4:3 landscape |
| ----------------- | -------------- | --------------- | ------------- |
| `"xs"` | 212x120 | 192x120 | 160x120 |
| `"xs+"` | 284x160 | 256x160 | 212x160 |
| `"sm"` | 356x200 | 320x200 | 266x200 | 
| `"sm+"` | 426x240 | 384x240 | 320x240 |
| `"md"` | 568x320 | 512x320 | 426x320 |
| `"md+"` | 640x360 | 576x360 | 480x360 |
| `"lg"` | 852x480 | 768x480 | 640x480 |
| `"lg+"` | 1066x600 | 960x600 | 800x600 |