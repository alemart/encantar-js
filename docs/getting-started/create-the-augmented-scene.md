# Create the augmented scene

Now that the image is being tracked, the next step is to render a virtual scene on top of it. You need a 3D rendering technology to do that.

## Pick a 3D rendering technology

encantAR.js is not a 3D rendering technology. It is an Augmented Reality technology that provides the data you need in order to augment your physical scenes. There are free and open-source 3D rendering technologies for the web that you can find online and use with encantAR.js. Popular solutions include: A-Frame, Babylon.js and Three.js. You can also use other solutions. encantAR.js lets you pick any 3D rendering technology.

Once you pick a 3D rendering technology, you need to integrate it with encantAR.js. There is a code that is responsible for that integration. I call it a _plugin_. Among other things, a plugin transports the tracking results from encantAR.js to the 3D rendering technology of your choice.

## Use a plugin

Writing a plugin is a task of moderate complexity. It requires dealing with matrices, with performance issues, and with some idiosyncrasies of the 3D rendering technologies in order to make sure it all works as intended. It is advisable to have specialized knowledge of computer graphics programming in order to write a plugin that works correctly.

I provide easy-to-use plugins that work with different 3D rendering technologies in my demos, so that you don't need to deal with the complexity. Those plugins are JavaScript (.js) files. You just need to add a plugin to your web page (e.g., via a `<script>` tag) and then the integration will be done for you. It's really that simple!

[Find the plugins in my demos](../demos.md){ .md-button ._blank }

## Create the virtual scene

You will create the virtual scene using the 3D rendering technology of your choice. As soon as you combine it with a plugin, the physical scene will be automatically augmented with the virtual scene, thus creating the augmented scene.

<figure markdown>
<video poster="../../img/demo-cool2.webp" style="width:600px" controls muted loop playsinline autoplay oncanplay="this.muted=true;this.play()">
    <source src="../../img/demo-cool2.webm" type="video/webm" />
    <source src="../../img/demo-cool2.mp4" type="video/mp4" />
</video>
<figcaption markdown>An augmented scene with a [3D model](../assets/my-3d-model.glb "A public domain 3D model from Kenney, converted to glTF format") from [Kenney](https://www.kenney.nl){ ._blank }</figcaption>
</figure>

Let me tell you a bit more about the 3D rendering technologies I just mentioned.

### A-Frame

[A-Frame](https://aframe.io){ ._blank } is an open-source framework used to build virtual reality (VR) experiences for the web. When you combine it with encantAR.js, you become able to use it to create AR experiences too - without the need of special hardware or software.

A-Frame is built on top of [Three.js](#threejs) and extends it in powerful ways. It introduces a HTML-based declarative approach for [scene graphs](https://en.wikipedia.org/wiki/Scene_graph){ ._blank }, empowering them with the [Entity-Component-System](https://en.wikipedia.org/wiki/Entity_component_system){ ._blank }, a software pattern commonly used in game development. Sounds complicated? It is not!

A-Frame is easy for beginners and pleasing for experts. A simple scene is declared like this:

```html title="index.html" hl_lines="7-8 11-12 23-36"
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>encantAR.js WebAR demo</title>
        <!-- include aframe -->
        <script src="aframe-vX.Y.Z.min.js"></script>
        <script src="encantar.js"></script>
        <script src="ar-demo.js"></script>
        <!-- include the aframe plugin for encantar.js -->
        <script src="aframe-with-encantar.js"></script>
        <style>body { background-color: #3d5afe; }</style>
    </head>
    <body>
        <div id="ar-viewport"></div>
        <img id="my-reference-image" src="my-reference-image.webp" hidden>
        <video id="my-video" hidden muted loop playsinline autoplay>
            <source src="my-video.webm" type="video/webm" />
            <source src="my-video.mp4" type="video/mp4" />
        </video>

        <!-- This is a scene -->
        <a-scene ar-scene>
            <a-camera ar-camera></a-camera>

            <!-- Whatever you add to <ar-root> will appear in AR -->
            <ar-root>
                <a-entity gltf-model="#my-3d-model"></a-entity>
            </ar-root>

            <!-- Declare external media files here -->
            <a-assets>
                <a-asset-item id="my-3d-model" src="my-3d-model.glb"></a-asset-item>
            </a-assets>
        </a-scene>

    </body>
</html>
```

`<ar-root>` is not part of A-Frame, but it becomes available as soon as you use my plugin.

A-Frame lets you create animated scenes with special effects simply by declaring things, like in the above example. In many cases, writing new JavaScript code is not needed. A-Frame also includes a visual inspector that makes things really easy for non-coders.

### Babylon.js

[Babylon.js](https://www.babylonjs.com){ ._blank } is a powerful open-source game and 3D rendering engine for the web. It includes pretty much all features you commonly find in 3D rendering engines (scene graphs, lights, materials, meshes, etc.), plus systems that are specific to game engines (animation engine, audio engine, collision system, physics system, support for sprites, etc.), plus all kinds of sophisticated features for various applications.

Babylon.js has an amazing documentation with plenty of learning resources. Even though it can be used by beginners, it's recommended to have working JavaScript experience before creating projects with it.

### Three.js

[Three.js](https://threejs.org){ ._blank } is a popular open-source JavaScript library used to render 3D graphics in web browsers. It supports many features, including: scene graphs, cameras, animations, lights, materials, loading of 3D models, mathematical utilities, special effects, and more. It has an active and vibrant community. Many community-made extensions are available.

Three.js often uses [WebGL](https://webglfundamentals.org){ ._blank } to draw 3D graphics. WebGL is a low-level rasterization engine that draws points, lines and triangles. It's seldom used directly by the developers of applications.

Using Three.js requires more JavaScript experience than using A-Frame in most cases, but it's also a great choice if you're comfortable with coding. Compared to A-Frame, Three.js offers you additional freedom on how you can organize your code, because it's a library, not a framework.