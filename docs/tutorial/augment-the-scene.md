# Augment the scene

We're already tracking an image of the physical world. The next step is to augment it with computer graphics. You'll use a different technology to render the graphics.

## Pick a 3D rendering technology

encantar.js is not a 3D rendering technology. It is an Augmented Reality technology that provides the data you need in order to augment your physical scenes. There are free and open-source 3D rendering technologies that you can use with encantar.js. Popular solutions include: [A-Frame](#a-frame), [Babylon.js](#babylonjs) and [Three.js](#threejs). You can also use other solutions. encantar.js lets you pick any web-based 3D rendering technology.

Once you pick a 3D rendering technology, you need to integrate it with encantar.js. There is a code that is responsible for that integration. I call it a _plugin_. Among other things, a plugin transports the tracking results from encantar.js to the 3D rendering technology of your choice.

## Use a plugin

Writing a plugin is a task of moderate complexity. It requires dealing with maths and with some idiosyncrasies of the 3D rendering technologies in order to make sure that it all works as intended. I provide easy-to-use plugins that work with different 3D rendering technologies, so that you don't need to deal with that complexity yourself. Plugins are shipped as JavaScript (.js) files. You just need to add a plugin to your web page, and then the integration will be done for you!

[Get the plugins in the demos](../../demos){ .md-button .md-button--primary ._blank }

## Create the virtual scene

You will create the virtual scene using the 3D rendering technology of your choice. As soon as you combine it with an appropriate plugin, the physical scene will be automagically augmented with the virtual scene, thus creating the augmented scene.

Let me tell you more about the 3D rendering technologies I just mentioned.

### A-Frame

[A-Frame](https://aframe.io){ ._blank } is an open-source framework used to build virtual reality (VR) experiences for the web. When you combine it with encantar.js, you become able to use it to create AR experiences too - without the need of special hardware or software.

A-Frame is built on top of [Three.js](#threejs) and extends it in powerful ways. It introduces a HTML-based declarative approach for [scene graphs](https://en.wikipedia.org/wiki/Scene_graph){ ._blank }, empowering them with the [Entity-Component-System](https://en.wikipedia.org/wiki/Entity_component_system){ ._blank }, a software pattern commonly used in game development. A-Frame is easy for beginners and pleasing for experts. In many cases, writing JavaScript code is not needed.

It's easy to construct a basic augmented scene, and no JavaScript is needed for that:

```html
<a-scene encantar="stats: true; gizmos: true">

    <!-- Sources of data -->
    <ar-sources>
        <ar-camera-source></ar-camera-source> <!-- webcam -->
    </ar-sources>

    <!-- Trackers -->
    <ar-trackers>
        <ar-image-tracker>
            <ar-reference-image name="mage" src="mage.png"></ar-reference-image>
        </ar-image-tracker>
    </ar-trackers>

    <!-- AR Viewport -->
    <ar-viewport></ar-viewport>

    <!-- Virtual camera for AR -->
    <ar-camera></ar-camera>

    <!-- Root node: this will be displayed in AR -->
    <ar-root reference-image="mage">
        <a-box color="yellow" position="0 0 0.5"></a-box>
    </ar-root>

</a-scene>
```

[Tell me more!](../api/plugin-aframe.md){ .md-button ._blank }

### Babylon.js

[Babylon.js](https://www.babylonjs.com){ ._blank } is a powerful open-source game and 3D rendering engine for the web. It includes pretty much all features you commonly find in 3D rendering engines (scene graphs, lights, materials, meshes, animations, etc.), plus systems that are specific to game engines (audio engine, collision system, physics system, support for sprites, etc.), plus all kinds of sophisticated features for various applications.

Babylon.js has an amazing documentation with plenty of learning resources, as well as a helpful and friendly community! Even though it can be used by beginners, it's recommended to have experience with JavaScript before creating projects with it.

[Tell me more!](../api/plugin-babylon.md){ .md-button ._blank }

### Three.js

[Three.js](https://threejs.org){ ._blank } is a popular open-source JavaScript library used to render 3D graphics in web browsers. It has many features, including: scene graphs, cameras, animations, lights, materials, loading of 3D models, mathematical utilities, special effects, and more. It has an active and vibrant community. Many community-made extensions are available.

Using Three.js requires more JavaScript experience than using A-Frame in most cases, but it's also a great choice if you're comfortable with coding. Compared to A-Frame, Three.js offers you additional freedom on how you can organize your code, because it's a library, not a framework.

[Tell me more!](../api/plugin-three.md){ .md-button ._blank }