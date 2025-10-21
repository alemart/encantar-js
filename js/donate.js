document.addEventListener('DOMContentLoaded', function() {
    const script = document.createElement('script');

    script.addEventListener('load', function() {
        kofiWidgetOverlay.draw('alemart', {
            'type': 'floating-chat',
            'floating-chat.donateButton.text': 'Give thanks',
            'floating-chat.donateButton.background-color': '#7E56C2',
            'floating-chat.donateButton.text-color': 'white'
        });
    });

    script.addEventListener('error', function(e) {
        console.log(`Can't load the Ko-fi widget`, e);
    });

    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';

    document.body.appendChild(script);

    const style = document.createElement('style');
    style.appendChild(document.createTextNode(`
        .floating-chat-kofi-popup-iframe, .floating-chat-kofi-popup-iframe-mobi {
            right: 16px !important;
            left: initial !important;
        }
        .floatingchat-container-wrap, .floatingchat-container-wrap-mobi {
            bottom: 18px !important;
            right: 12px !important;
            left: initial !important;
        }
        @media only screen and (max-device-width: 750px) {
            .floatingchat-container-wrap-mobi {
                width: 50% !important;
            }
        }
    `));
    document.head.appendChild(style);
});
