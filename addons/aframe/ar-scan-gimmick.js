/*!
 * A-Frame scan gimmick for encantar.js
 * @version 1.1.0
 * @author Alexandre Martins (https://encantar.dev)
 * @license LGPL-3.0-or-later
 */

(function() {

const DEFAULT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAVklEQVRYR+2WMQ4AIAgD4f+PVlzFYGSpw3UlQHOaBjexXLzfMJAIjFD1LB6q6q/9RwO3Jd1/s8ztszEAAQiQhBCAAARIQghA4E8C0rO8e3J3+4hiOYEJMwaAIT1kBDMAAAAASUVORK5CYII=';

AFRAME.registerComponent('ar-scan-gimmick', {

    schema: {

        /** URL of an image */
        'src': { type: 'string', default: DEFAULT_IMAGE },

        /** opacity of the image */
        'opacity': { type: 'number', default: 1.0 }

    },

    init()
    {
        const scene = this.el.sceneEl;
        const ar = scene.systems.ar;

        this._ar = ar;
        this._img = null;
        this._hadGizmos = false;

        this._onTargetFound = this._onTargetFound.bind(this);
        this._onTargetLost = this._onTargetLost.bind(this);
        this._registerEvents();

        scene.addEventListener('arready', () => {

            this._validate();

            const session = ar.session;
            this._hadGizmos = session.gizmos.visible;

            const img = this._createImage();
            this.el.parentNode.appendChild(img);
            this._img = img;

        });
    },

    remove()
    {
        if(this._img === null)
            return;

        this._unregisterEvents();

        this.el.parentNode.removeChild(this._img);
        this._img = null;
    },

    _registerEvents()
    {
        const scene = this.el.sceneEl;

        scene.addEventListener('artargetfound', this._onTargetFound);
        scene.addEventListener('artargetlost', this._onTargetLost);
    },

    _unregisterEvents()
    {
        const scene = this.el.sceneEl;

        scene.removeEventListener('artargetlost', this._onTargetLost);
        scene.removeEventListener('artargetfound', this._onTargetFound);
    },

    _onTargetFound(event)
    {
        const ar = this._ar;
        const img = this._img;

        ar.session.gizmos.visible = false;
        img.style.display = 'none';
    },

    _onTargetLost(event)
    {
        const ar = this._ar;
        const img = this._img;

        ar.session.gizmos.visible = this._hadGizmos;
        img.style.display = 'inline-block';
    },

    _createImage()
    {
        const img = document.createElement('img');

        img.src = this.data.src;
        img.draggable = false;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.display = 'inline-block';
        img.style.opacity = this.data.opacity;

        if(img.src == DEFAULT_IMAGE)
            img.style.imageRendering = 'pixelated';

        return img;
    },

    _validate()
    {
        if(!this.el.parentNode.getAttribute('ar-hud'))
            console.error('a-entity with ar-scan-gimmick must be a direct child of ar-hud');
    },

});

})();
