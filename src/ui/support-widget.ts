/*
 * encantar.js
 * GPU-accelerated Augmented Reality for the web
 * Copyright (C) 2022-2024 Alexandre Martins <alemartf(at)gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * support-widget.ts
 * Support widget
 */

/*

This widget is intended to ask users to support the project

You are asked to support the project, so that it can continue to grow

https://encantar.dev/supporter

*/

declare const __AR_FLAGS__: number;
const SUPPORTER_URL = 'https://encantar.dev/supporter';
const BUTTON_IMAGE = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22298.803%22%20height%3D%2266.241%22%20viewBox%3D%220%200%2079.057%2017.526%22%3E%3Cg%20aria-label%3D%22encantar.js%22%20style%3D%22font-weight%3A400%3Bfont-size%3A10.58333302px%3Bline-height%3A1.25%3Bfont-family%3Asans-serif%3Bletter-spacing%3A0%3Bword-spacing%3A0%3Bstroke%3A%23000%3Bstroke-width%3A.39686999%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-dashoffset%3A0%3Bstroke-opacity%3A.50196078%22%20stroke%3D%22none%22%3E%3Cpath%20d%3D%22M8.488%208.848q0%20.952-.19%201.312H3.872q-.063.995-.063%201.355%200%203.323%201.503%203.323%201.143%200%202.01-1.905h.784q-.635%202.942-3.154%202.942-3.366%200-3.366-5.82%200-1.885.847-3.197Q3.45%205.355%205.25%205.355q1.545%200%202.392.974.847.952.847%202.519zm-1.905-.424q0-2.265-1.27-2.265-.55%200-.995.868-.381.741-.381%201.355v.53h2.625q.02-.255.02-.488zm11.98%205.567q0%20.72-.508%201.207-.508.465-1.228.465-2.053%200-2.053-1.905V9.715q0-.952-.36-1.82-.465-1.1-1.27-1.1-.296%200-.55.275-.254.254-.254.571-.127%205.398-.127%205.525%200%201.63%201.334%201.481v.995H8.678v-1.08q.148-.084.53-.084.402-.021.55-.17.254-.19.254-.804%200-.275-.064-.804-.042-.55-.042-.826%200-.973.17-2.73l.126-1.334q0-.508-.36-.783t-.867-.254l.02-.106q0-.423-.126-.677%201.206-.317%203.662-.931-.064.72-.064.825%200%20.233.042.402.741-.93%201.503-.93.91%200%201.948%201.311.973%201.25.973%202.202v4.318q0%201.037.36%201.354.402-.232.402-.677%200-.085-.02-.275-.022-.19-.022-.296v-.17h.91zm7.218-6.286q0%20.613-.381%201.08-.36.444-.953.444-.508%200-.867-.381-.36-.381-.36-.89%200-.38.317-.677.318-.296.699-.296.127%200%20.254.106.127.084.233.084v-.042q.02-.868-1.46-.868-1.313%200-1.8%201.355-.296.825-.296%202.455%200%202.011.148%202.942.338%202.032%201.397%202.032.656%200%201.206-.508.085-.084.868-1.016.445.212.783.55-.91%201.08-1.206%201.334-.762.656-1.609.656-2.074%200-3.027-2.095-.698-1.545-.698-3.916%200-1.672.868-3.111%201.016-1.694%202.56-1.694%201.25%200%202.202.593%201.122.698%201.122%201.863zm8.191%207.62q0%20.317-.063.529-.127%200-.402.063-.254.064-.402.064-.53%200-1.016-.36-.487-.36-.678-.868-1.08%201.122-2.497%201.122-1.292%200-2.075-.72t-.783-1.99q0-1.587.974-2.54.995-.952%202.624-.952.36%200%20.762.042.085-.444.085-.952%200-2.582-1.778-2.582-.74%200-1.122.846.381-.148.678-.148.846%200%20.846%201.334%200%20.38-.487.762-.465.36-.846.36-1.313%200-1.313-1.779%200-1.29%201.292-1.862.952-.445%202.434-.445%201.587%200%202.138%201.757.317%201.016.317%203.09%200%20.424-.021%201.292-.021.867-.021%201.312%200%202.244.72%202.244.232%200%20.55-.19.084.274.084.57zm-3.513-1.842q-.064-1.122-.064-.952%200-.635.043-1.651-.36-.106-.847-.106-.699%200-1.08.656-.338.53-.338%201.291%200%20.826.402%201.44.466.677%201.27.677.444%200%20.487-.508.084-.783.127-.847z%22%20style%3D%22font-style%3Anormal%3Bfont-variant%3Anormal%3Bfont-weight%3A400%3Bfont-stretch%3Anormal%3Bfont-size%3A21.16666603px%3Bfont-family%3ADuality%3B-inkscape-font-specification%3ADuality%3Bfill%3A%23ff95ff%3Bfill-opacity%3A1%3Bstroke%3A%23ffffea%3Bstroke-width%3A0%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-dashoffset%3A0%3Bstroke-opacity%3A.9754902%3Bpaint-order%3Astroke%20fill%20markers%22%20transform%3D%22translate(-1.587%20-1.587)%22%2F%3E%3Cpath%20d%3D%22M43.794%2013.991q0%20.72-.508%201.207-.508.465-1.228.465-2.053%200-2.053-1.905V9.715q0-.952-.36-1.82-.466-1.1-1.27-1.1-.296%200-.55.275-.254.254-.254.571-.127%205.398-.127%205.525%200%201.63%201.333%201.481v.995H33.91v-1.08q.148-.084.53-.084.401-.021.55-.17.253-.19.253-.804%200-.275-.063-.804-.042-.55-.042-.826%200-.973.169-2.73l.127-1.334q0-.508-.36-.783t-.868-.254l.021-.106q0-.423-.127-.677%201.207-.317%203.662-.931-.063.72-.063.825%200%20.233.042.402.741-.93%201.503-.93.91%200%201.947%201.311.974%201.25.974%202.202v4.318q0%201.037.36%201.354.402-.232.402-.677%200-.085-.021-.275t-.021-.296v-.17h.91zm5.101.402q0%20.53-.508.953t-1.058.423q-1.63%200-2.011-1.1-.17-.466-.17-2.456%200-1.376-.063-3.535l-.042-1.714q-.297-.17-.678-.17-.084%200-.275.043-.17.021-.275.021.106-.423.106-.974%201.418.021%202.201-1.058.699-.953.656-2.413h.72v3.175q.402.042%201.206.19V6.88h-1.439v7.112q0%20.106.296.36h.445v-1.228h.889z%22%20style%3D%22font-style%3Anormal%3Bfont-variant%3Anormal%3Bfont-weight%3A400%3Bfont-stretch%3Anormal%3Bfont-size%3A21.16666603px%3Bfont-family%3ADuality%3B-inkscape-font-specification%3ADuality%3Bfill%3A%23ff95ff%3Bfill-opacity%3A1%3Bstroke%3A%23ffffea%3Bstroke-width%3A0%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-dashoffset%3A0%3Bstroke-opacity%3A.9754902%3Bpaint-order%3Astroke%20fill%20markers%22%20transform%3D%22translate(-1.587%20-1.587)%22%2F%3E%3Cpath%20d%3D%22M56.917%2015.325q0%20.317-.063.529-.127%200-.403.063-.254.064-.402.064-.529%200-1.016-.36t-.677-.868q-1.08%201.122-2.498%201.122-1.29%200-2.074-.72T49%2013.165q0-1.587.973-2.54.995-.952%202.625-.952.36%200%20.762.042.085-.444.085-.952%200-2.582-1.778-2.582-.741%200-1.122.846.38-.148.677-.148.847%200%20.847%201.334%200%20.38-.487.762-.466.36-.847.36-1.312%200-1.312-1.779%200-1.29%201.291-1.862.953-.445%202.434-.445%201.588%200%202.138%201.757.318%201.016.318%203.09%200%20.424-.021%201.292-.022.867-.022%201.312%200%202.244.72%202.244.233%200%20.55-.19.085.274.085.57zm-3.514-1.842q-.063-1.122-.063-.952%200-.635.042-1.651-.36-.106-.846-.106-.699%200-1.08.656-.339.53-.339%201.291%200%20.826.403%201.44.465.677%201.27.677.444%200%20.486-.508.085-.783.127-.847z%22%20style%3D%22fill%3A%23ffea2a%3Bfill-opacity%3A1%3Bstroke%3A%23ffffea%3Bstroke-width%3A0%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-dashoffset%3A0%3Bstroke-opacity%3A.9754902%3Bpaint-order%3Astroke%20fill%20markers%22%20transform%3D%22translate(-1.587%20-1.587)%22%2F%3E%3Cpath%20d%3D%22M64.347%207.493q0%20.571-.36%201.206-.424.741-.932.741-.677%200-1.206-.465-.53-.466-.53-1.143%200-.953%201.08-.953.106%200%20.254.064.148.063.212.063v-.042q.021-.593-.72-.593-1.757%200-1.757%203.98%200%20.36.043%201.058t.042%201.037v.36q-.021.254-.021.36%200%201.63%201.333%201.481v.995h-4.868v-1.08l.699-.148q.402-.063.592-.36.127-.211.127-.38l.106-5.864q0-.486-.36-.762-.36-.296-.868-.275l.022-.106q0-.423-.127-.677%201.121-.317%203.344-.931%200%20.021-.064.846-.042.572-.042%201.186l.572-.826q.402-.55.592-.72.36-.296.826-.296.973%200%201.481.635.53.635.53%201.609z%22%20style%3D%22fill%3A%23ffea2a%3Bfill-opacity%3A1%3Bstroke%3A%23ffffea%3Bstroke-width%3A0%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-dashoffset%3A0%3Bstroke-opacity%3A.9754902%3Bpaint-order%3Astroke%20fill%20markers%22%20transform%3D%22translate(-1.587%20-1.587)%22%2F%3E%3Cpath%20d%3D%22M67.564%2015.113q0%20.593-.487%201.058t-1.1.466-1.059-.55q-.423-.53-.423-1.186%200-.55.508-.952.444-.36%201.037-.36.656%200%201.08.444.444.424.444%201.08z%22%20style%3D%22font-style%3Anormal%3Bfont-variant%3Anormal%3Bfont-weight%3A400%3Bfont-stretch%3Anormal%3Bfont-size%3A21.16666603px%3Bfont-family%3ADuality%3B-inkscape-font-specification%3ADuality%3Bfill%3A%23ff95ff%3Bfill-opacity%3A1%3Bstroke%3A%23ffffea%3Bstroke-width%3A0%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-dashoffset%3A0%3Bstroke-opacity%3A.9754902%3Bpaint-order%3Astroke%20fill%20markers%22%20transform%3D%22translate(-1.587%20-1.587)%22%2F%3E%3Cpath%20d%3D%22M73.088%203.111q0%20.593-.486%201.059-.487.465-1.08.465-.635%200-1.08-.571-.402-.508-.402-1.164%200-.572.466-.932.487-.38%201.058-.38.657%200%201.08.444.444.423.444%201.08zm-.105%2013.103q0%201.08-1.016%201.99-.995.91-2.075.91-1.058%200-1.884-.572-.931-.614-.931-1.63%200-.635.275-1.1.318-.572.91-.572.508%200%20.953.275.529.318.529.783%200%20.847-.423%201.101-.254.17-1.228.254.17.148.53.339.38.211.55.211.635%200%201.079-.762.402-.656.402-1.354V7.345q0-.36-.423-.593-.423-.254-.783-.212v-.105q.02-.424-.106-.657%201.206-.338%203.64-.93zm7.662-3.197q0%20.995-.868%202.054-.847%201.037-1.841%201.037-1.567%200-2.604-.466-1.418-.635-1.418-2.01%200-.636.38-1.101.382-.487.996-.487.529%200%20.889.402.38.381.38.931%200%20.381-.338.699-.317.296-.72.296-.148%200-.275-.085-.106-.084-.148-.105.17.931%201.99.931.656%200%201.206-.423.55-.424.55-1.059%200-.762-1.121-1.524-1.905-1.333-2.053-1.481-1.122-1.038-1.122-2.456%200-.402.233-.973.804-1.99%202.413-1.99%201.27%200%202.222.614%201.143.698%201.143%201.884%200%20.635-.381%201.1t-.995.466q-.529%200-.91-.381-.36-.402-.36-.931%200-.403.318-.699.338-.317.74-.317.149%200%20.276.105.148.085.19.085.021-.085.021-.148%200-.402-.804-.614-.571-.148-1.143-.148-.466%200-.952.402-.487.381-.487.826%200%20.931.72%201.65.465.466%201.63%201.144%201.163.656%201.544%201.016.17.148.424.846.275.678.275.91z%22%20style%3D%22font-style%3Anormal%3Bfont-variant%3Anormal%3Bfont-weight%3A400%3Bfont-stretch%3Anormal%3Bfont-size%3A21.16666603px%3Bfont-family%3ADuality%3B-inkscape-font-specification%3ADuality%3Bfill%3A%23ff95ff%3Bfill-opacity%3A1%3Bstroke%3A%23ffffea%3Bstroke-width%3A0%3Bstroke-linecap%3Abutt%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3Bstroke-dasharray%3Anone%3Bstroke-dashoffset%3A0%3Bstroke-opacity%3A.9754902%3Bpaint-order%3Astroke%20fill%20markers%22%20transform%3D%22translate(-1.587%20-1.587)%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E';

/**
 * Support widget
 */
export class SupportWidget
{
    /** The element of the widget */
    private readonly _element: HTMLElement;



    /**
     * Constructor
     */
    constructor()
    {
        this._element = this._createElement();
    }

    /**
     * Initialize
     * @param parent parent node
     */
    init(parent: Node): void
    {
        parent.appendChild(this._element);
    }

    /**
     * Release
     */
    release(): void
    {
        this._element.remove();
    }

    /**
     * Create the element of the widget
     */
    private _createElement(): HTMLElement
    {
        const button = document.createElement('button');
        const img = document.createElement('img');

        button.innerText = 'Support';
        button.style.font = 'bold small-caps 1.25rem sans-serif';
        button.style.color = 'white';
        button.style.padding = '0.5rem';
        button.style.maxWidth = '40%';

        button.style.position = 'absolute';
        button.style.bottom = '0';
        button.style.right = '50%';
        button.style.transform = 'translateX(50%)';

        //button.style.opacity = '0.75';
        button.style.cursor = 'pointer';
        button.style.outline = 'none';
        (button.style as any)['-webkit-tap-highlight-color'] = 'transparent';
        button.draggable = false;
        button.hidden = !!(__AR_FLAGS__ & 1);

        button.style.backgroundColor = 'rgba(0,0,0,0.4)';
        button.style.borderColor = 'white';
        button.style.borderStyle = 'solid';
        button.style.borderWidth = '2px';
        button.style.borderTopLeftRadius = '8px';
        button.style.borderTopRightRadius = '8px';
        button.style.borderBottomStyle = 'none';

        img.style.width = '100%';
        img.style.maxHeight = '10vh';
        img.style.pointerEvents = 'none';
        img.src = BUTTON_IMAGE;
        button.appendChild(img);

        const highlight = () => {
            button.style.backgroundColor = '#ffd500';
            button.style.borderColor = '#ffd500';
            //button.style.opacity = '1.0';
        };

        const dehighlight = () => {
            button.style.backgroundColor = 'rgba(0,0,0,0.25)';
            button.style.borderColor = 'white';
            //button.style.opacity = '0.75';
        };

        button.addEventListener('pointerdown', highlight);
        button.addEventListener('pointerup', dehighlight);
        button.addEventListener('pointerleave', dehighlight);
        button.addEventListener('click', () => {
            location.href = SUPPORTER_URL;
        });

        return button;
    }
}
