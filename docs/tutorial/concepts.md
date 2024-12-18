# Concepts

Before diving into AR with you, I need to introduce a few concepts. Please take the time to read them all. Feel free to come back to this page at any time.

## What is Augmented Reality?

Let me clarify what I mean by terms such as Augmented Reality and WebAR:

1. **Augmented Reality** is the augmentation of physical reality with virtual elements. We typically augment physical reality with imagery generated by computer graphics. In this context, the word augment means: to blend the physical and the virtual imagery in a visually correlated manner.

    1.1. **AR** is an abbreviation of Augmented Reality.

2. An **Augmented Reality experience**, or Augmented Reality program, is a computer program designed to let users experience Augmented Reality[^1]. Augmented Reality experiences come in different shapes. Some are designed for smartphones and tablets, others for special headsets, and so on.

3. **WebAR** is a set of technologies used to create Augmented Reality experiences that run in web browsers. WebAR makes it easy for users to experience AR, because they can have immediate access to the AR experiences. All they have to do is open a web page. They are not tied to specific platforms and they also don't need to download apps.

4. A **WebAR experience** is an Augmented Reality experience developed using WebAR technology.

5. **encantar.js** is a WebAR technology. I also call it a WebAR engine. Lots of computations have to be performed behind the scenes in order to make an Augmented Reality experience possible. encantar.js uses the GPU[^2] to accelerate many of those computations. In fact, the GPU and the CPU[^3] are used together. This approach improves the performance of the WebAR experience and ultimately leads to a better user experience.

You can use encantar.js to create amazing WebAR experiences! :wink:

[^1]: An experience of AR is an event in consciousness in which AR is experienced. I sometimes use the latter definition.
[^2]: Graphics Processing Unit
[^3]: Central Processing Unit

## Basic concepts

Let me explain some concepts that you'll see over and over again when developing WebAR experiences with encantar.js:

1. An Augmented Reality experience augments a physical scene with a virtual scene.

    1.1. The **physical scene** is a scene of the physical world.

    1.2. The **virtual scene** is a scene generated by computer graphics.

    1.3. The **augmented scene** is the physical scene augmented with the virtual scene.

2. A **session** is a central component of a WebAR experience. It handles the **main loop**. The main loop performs two central tasks: it analyzes the input data and then passes the result of that analysis to the user callback.

    2.1. The **user callback** is a function that updates and renders the virtual scene. It is repeated in an **animation loop**, which is part of the main loop.
    
    2.2. The main loop is repeated until the session ends. The session ends when the user closes the web page, or by deliberate command.

3. A session has one or more **sources of data** linked to it. A typical source of data is a video stream. Such a stream usually comes from a webcam or from a video file.

    3.1. A source of data produces **input data**.

4. A **tracker** is a subsystem of the WebAR engine that analyzes input data in some way. Trackers are meant to be attached to a session. Example: an image tracker is a type of tracker. If we attach an image tracker to a session, then we will be able to track images in that session.

5. The user callback receives a **frame**. A frame is an object that holds data for rendering the virtual scene in a way that is consistent with the input data at a particular moment in time. Simply put, frames help us augment the physical scene with the virtual scene.

    5.1. The data held by a frame is computed by the trackers that are attached to the session.

6. A session is linked to a **viewport**. The viewport is the area in which we'll display the augmented scene. It's represented by a container defined by a suitable HTML element, typically a `<div>`.

7. A session has a **mode**. The mode can be either immersive or inline.

    7.1. In immersive mode, the augmented scene is displayed in such a way that it occupies the entire area of the screen in which the web page is shown. Think of it as a kind of fullscreen. The immersive mode is what is typically wanted.
    
    7.2. In inline mode, the augmented scene is displayed in a way that is consistent with the typical flow of a web page. We can display the augmented scene in a web page such as this one - in the middle of text, links and other elements.

Now let's create our first WebAR experience! It gets to be fun, I promise! :wink: