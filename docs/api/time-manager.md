# TimeManager

Time-related utilities. They are useful for animating virtual scenes.

## Properties

### elapsed

`time.elapsed: number, read-only`

Elapsed time since the start of the session, measured at the beginning of the current animation frame and given in seconds.

### delta

`time.delta: number, read-only`

Elapsed time between the current and the previous animation frame, given in seconds. Use this value to produce animations that are independent of the framerate.

### scale

`time.scale: number`

Time scale. Use it to accelerate, slowdown or pause the passage of time. Defaults to 1.

### unscaled

`time.unscaled: number, read-only`

Time scale independent seconds since the start of the session, measured at the beginning of the current animation frame.