(function() {

const IMAGE_PREFIX = '../assets/';
const DEFAULT_IMAGE = 'mage.webp';

const paths = [];
let index = 0;

function changeImage(direction)
{
    index = (index + direction + paths.length) % paths.length;
    document.body.style.backgroundImage = 'url(' + IMAGE_PREFIX + paths[index] + ')';
}

document.addEventListener('DOMContentLoaded', function() {

    const arImages = (document.body.dataset.arImages || DEFAULT_IMAGE).split(';');
    paths.push.apply(paths, arImages);
    changeImage(0);

    const prev = document.getElementById('prev');
    const next = document.getElementById('next');
    if(prev && next) {
        prev.addEventListener('click', function() { changeImage(-1); });
        next.addEventListener('click', function() { changeImage(+1); });

        if(paths.length < 2)
            prev.hidden = next.hidden = true;
    }

    document.querySelectorAll('a').forEach(function(a) {
        a.addEventListener('click', function() {
            window.goatcounter && window.goatcounter.count({
                path: function(p) { return a.id + '-' + p; },
                event: true,
            });
        });
    });

});

})();
