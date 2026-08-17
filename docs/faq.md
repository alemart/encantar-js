# Frequently Asked Questions (FAQ)

## General

### What is encantar.js?

encantar.js is a standalone GPU-accelerated Augmented Reality engine for the web. The name is derived from the Portuguese and Spanish word _encantar_, which means: to enchant, to delight, to love, to fascinate, to put a magical spell on someone or something. :sparkles:

### What about its compatibility?

encantar.js runs in any device and is compatible with all major web browsers:

| Chrome | Edge | Firefox | Opera | Safari* |
| ------ | ---- | ------- | ----- | ------- |
| ✔      | ✔    | ✔       | ✔     | ✔       |

\* use Safari 15.2 or later.

encantar.js requires WebGL2 and WebAssembly, which are widely supported.

### Is this WebXR?

No, encantar.js is not WebXR. It's [WebAR](#what-is-webar). The WebXR API allows you to access functionalities of VR and AR-capable devices in web browsers. It relies on other technologies, such as Google's ARCore or Apple's ARKit, to run the show. Those technologies are great, though they are supported on specific devices, which may or may not match your users' devices. Also, at the time of this writing, WebXR is unsupported on iPhone except through unofficial workarounds. On the other hand, encantar.js is fully standalone and is built from scratch using standard web technologies such as WebGL2 and WebAssembly, which are widely supported. It works on mobile and even on Desktop computers. My intention is to give it broad compatibility.

### What is WebAR?

As explained in the [concepts page](tutorial/concepts.md), WebAR is a set of technologies used to create Augmented Reality experiences that run in web browsers. WebAR makes it easy for users to experience AR, because they can have immediate access to the AR experiences. All they have to do is open a web page. They are not tied to specific platforms and they also don't need to download apps.

### Any recommendations?

For a good experience:

* Don't move the camera nor the target image too quickly. This produces motion blur.
* The target image should appear clearly in the video.
* The physical environment should be properly illuminated.
* If you're scanning the image on a screen, make sure to adjust the brightness. If the screen is too bright (too dark), it will cause overexposure (underexposure) in the video and tracking difficulties - details of the images will be lost. Screen reflections are also undesirable.
* If you print the image, avoid shiny materials (e.g., glossy paper). They may generate artifacts in the image and interfere with the tracking. Prefer non-reflective materials.
* Avoid low-quality cameras. Cameras of common smartphones are okay.

See also: [Guidelines for Images](guidelines-for-images.md).

### How can I contact you?

[Get in touch here](contact.md).

## Licensing

### Is encantar.js free or paid?

There are two editions: Free and Professional. They are functionally equivalent, but have significant differences in usage rights.

### Which edition should I pick?

The Free Edition is licensed under version 3 of the [GNU GPL](license.md). You may use it as long as you comply with its license. Among other requirements, you need to:

- Distribute your application, and all its parts, as free and open-source software under the GNU GPL. You may **not** distribute non-free/proprietary applications with the Free Edition.
- Prominently display the [Library Watermark Notices](#can-i-remove-the-encantarjs-watermark) in the user interface.

If you're unable to meet the requirements of the GPL, then you need the Professional Edition:

- Purchase the Professional Edition for distributing non-free/proprietary projects to others (browser delivery counts as distribution). Use it in production.
- Using the Free Edition for internal development/prototyping is permitted as long as your proprietary application is **not** distributed to others. Do not use it in production.

|   | Free Edition | Professional Edition |
| - | ------------ | -------------------- |
| Your codebase | Same | Same |
| Best for | Open-source apps / Internal prototyping | Non-free apps / Client work |
| Keep Watermark Notices | **Mandatory** | Waived |
| Your work must be free & open | **Mandatory** | Waived |
| Suitable for proprietary works | No | **Yes** |

<div style="text-align:center" markdown>
!!! info "The Professional Edition is great for:"

    👨‍💻 **Creatives** requiring brand control.

    🎨 **Artists** creating non-profit or for-profit artwork.

    💼 **Agencies** doing proprietary client work.

    🛠️ **Indie devs** building proprietary products.

    🧑‍🏫 **Academics** may request a separate [Academic License](#i-work-in-an-academic-institution-can-i-use-this-proprietary-edition).

    [Buy Now](/buy){ .md-button .md-button--primary }
</div>

See also: [What do I get with the Professional Edition?](#what-do-i-get-with-the-professional-edition)

### Can I use the Free Edition for my free and open-source application?

Yes. Since your application is free and open-source, you don't need the Professional Edition. Include instructions for building and executing your application. Release it under the GPL.

### Can I use the Free Edition for my non-free/proprietary application?

You may use the Free Edition for internal development/prototyping, provided that you don't distribute your application to others. Don't use the Free Edition in production. You must [purchase the Professional Edition](/buy) before you distribute your application to others.

### Can I embed the Professional Edition in my proprietary application?

Yes. When using the Professional Edition, copyleft applies to the library, but it does **not** extend to your application. You can close the source code of your proprietary application and distribute it under the terms of your choice. However, if you modify the library, you can't make your modifications proprietary.

### Can I remove the encantar.js watermark?

Yes, provided that you:

- a) [purchase the Professional Edition](/buy); or
- b) replace the watermark with an equivalent feature that retains the same author attributions and legal notices. Such feature must be **convenient and prominently visible in the user interface**. In this case, you won't remove the watermark entirely, only change its form.

Let's take a look at the requirement:

> Pursuant to Section 7(b) of the GNU General Public License version 3 ("GPLv3"), **you must retain the author attributions and the legal notices displayed by means of the encantar.js Library Watermark** in all works that are combined with or linked to this library, as well as in all other works based on this library, and in the form of convenient and prominently visible Appropriate Legal Notices (defined in the GPLv3).

Section 7b of the GPLv3 states that the license may be supplemented with terms:

> b) Requiring preservation of specified reasonable legal notices or author attributions in that material or in the Appropriate Legal Notices displayed by works containing it

The definition of "Appropriate Legal Notices" is in Section 0 of the license:

> An interactive user interface displays "Appropriate Legal Notices" to the extent that it includes a **convenient and prominently visible** feature that (1) displays an appropriate copyright notice, and (2) tells the user that there is no warranty for the work (except to the extent that warranties are provided), that licensees may convey the work under this License, and how to view a copy of this License. If the interface presents a list of user commands or options, such as a menu, a prominent item in the list meets this criterion.

The encantar.js watermark and its accompanying About box fulfill the aforementioned requirement by default. They are displayed conveniently and prominently on the screen: an approach particularly suited for mobile AR. An alternative implementation consists of displaying these author attributions and legal notices in an "About" or "Legal Notices" section of your own, seamlessly integrated into your design, as long as they are **convenient and prominently visible in the user interface**. [This demo](/demos/hello-world) illustrates such implementation.

!!! tip

    The [Professional Edition](/buy) does not display the watermark. It's suitable for professional works requiring increased brand control.

## Professional Edition

### What do I get with the Professional Edition?

The Professional Edition is essential for professional proprietary work. When you purchase it, you receive a license key that unlocks a special permission. That permission allows you to distribute your proprietary applications with specific versions of the library, with no need to display the Watermark Notices in the user interface. In addition, you receive 1 year of library updates covered by that permission. After that period, you may continue to receive updates if you renew your purchase.

<div style="text-align:center" markdown>
!!! info "The Professional Edition offers you:"

    ✅ Permission to distribute proprietary applications.

    ✅ Brand control: no Watermark Notices.

    ✅ One year of library updates.

    [Buy Now](/buy){ .md-button .md-button--primary }
</div>

See also: [Which edition should I pick?](#which-edition-should-i-pick), [Can I remove the encantar.js watermark?](#can-i-remove-the-encantarjs-watermark)

### Do I have to renew my purchase each year?

No. The special permission is perpetual for the covered versions of the library. You only need to renew your purchase if you want to continue to receive updates to new versions of the library. If you're not renewing, freeze your covered library version in your `package.json` or equivalent.

### Can I grant that special permission to others?

No. That is an additional permission only granted by the author of the library. Others may receive that additional permission by purchasing the Professional Edition themselves.

### Any limits on the number of applications, deployments, or end users?

No, the license imposes no such limits. It's a great deal.

### Does the license cover internal development, testing, and production?

Yes.

### I'm a large organization. Am I eligible for this proprietary edition?

The Professional Edition is priced for individual creatives and small shops. While you are ineligible for this license, you may [request a separate license](contact.md) for your use case.

### I work in an academic institution. Can I use this proprietary edition?

The Professional Edition is priced for individual creatives and small shops. While your institution is ineligible for this license, we offer Academic Licenses [under request](contact.md), based on your use case.

### What if I'm a non-profit organization?

If you distribute your applications, and all their parts, as free and open-source software under the GPL, while also keeping the Watermark Notices, then you may use the [Free Edition](#which-edition-should-i-pick). Otherwise you must purchase a license, just like individuals doing non-profit works with the library.

### What if I'm making applications for clients?

Ask yourself: who is going to distribute the application?

Whoever distributes a proprietary application to others must have a license key. Browser delivery counts as distribution. If your clients are distributing proprietary applications (for example, through their own domain or app store account), then each of your clients needs their own license key. If you are the one distributing proprietary applications, then you need your own license key.

License keys are not transferable. A separate license key is required for each client who distributes proprietary applications. You can ask your client to buy a license key.

Your client doesn't need a separate license key if you are going to distribute the application through your own domain (assuming you have your own license key). In this case, you, the author of the application, must be able to distribute that application under your name.

A license key may be issued to an individual or to a company. The licensee must be the one distributing the application.

### What if the product is beyond my means, considering my country's currency?

If you are an individual creative / artist living in a country where your local currency and present earnings place this product beyond your reach, then you may [get in touch](contact.md), tell us about your situation, and request a regional discount. If a regional discount applies to your situation, then you will receive a bonus code that can make the product more affordable to you.

The continued availability of this policy depends on good faith. If the total income in your household is sufficient for you to afford the normal price, then purchase the product for its normal price. Recognize that the library brings you extraordinary value. For those who do client work, the product pays for itself quickly. You are trusted not to abuse this policy, so that it can continue to exist.

### Can I rebrand the library and offer it as a SaaS?

No. You may not rebrand the Professional Edition of the library nor wrap it inside a product that offers similar core functionality or value. [You can't grant the special permission to others](#can-i-grant-that-special-permission-to-others). These restrictions apply even if your product includes additional features (such as a visual authoring tool for other creators), and even if it's offered as a Software as a Service (SaaS). The Professional Edition is not priced for the scale and value of platform-level redistribution. However, if you are interested in this WebAR technology, then we may be able to [reach a custom agreement](contact.md).

### Why pay for this library if it's open-source?

Because you'll receive [benefits that are essential for professional proprietary work](#which-edition-should-i-pick). Furthermore, a commercial offering is vital to sustain open-source AR. Commercial funding backs this independently developed library that:

1. respects your privacy and freedom
2. offers high performance, good quality, and ease of use
3. works on any device with a modern web browser, regardless of WebXR support
4. isn't locked into any vendor that may limit access or even disappear tomorrow

Building a WebAR technology from scratch with computer vision is a massive R&D undertaking. By choosing the Professional Edition, you receive a professional-grade tool with added benefits, as well as the peace of mind that comes with the knowing that your access to it will not &mdash; and effectively cannot &mdash; be removed. Your AR projects are yours to keep and share!

### Do I receive support?

[I'm happy to answer library-related questions](contact.md), but purchasing the Professional Edition does not include support services such as debugging your code, unless we have a separate agreement.

## Technical questions

### Why do my models appear "laid down" in AR?

encantar.js uses a right-handed coordinate system with the Z-axis pointing "up". The same convention is used in [Blender](https://www.blender.org){ ._blank }. When exporting your own models, make sure that the Z-axis points "up" and that the ground plane is the XY-plane. If your models appear "laid down" in AR, this is probably the issue.

!!! info "Fix with code"

    Fixing the orientation of the model is the preferred solution. However, you can also fix the issue with code: add a node (entity) to the scene graph and make it rotate its children by 90 degrees around the x-axis.

### Can I increase the resolution of the tracking?

Yes. You can increase the [resolution of the tracker](api/image-tracker.md#instantiation), as well as the [resolution of the camera](api/camera-source.md#instantiation), using the API. You can also increase the resolution of the rendered virtual scene by setting the [resolution of the viewport](api/viewport.md#instantiation). Performance is affected by various factors such as upload times (GPU). Test your AR experience on your target devices to find a good balance between performance and increased resolution.

### How do I know which image is detected?

Add an [event listener](api/image-tracker.md#targetfound) to the Image Tracker, as in the example:

```js
const tracker = AR.Tracker.Image();

// ...

tracker.addEventListener('targetfound', event => {

    // print the name of the Reference Image
    console.log('Found target: ' + event.referenceImage.name);

});
```

### I am enchanted!

I know! :wink:
