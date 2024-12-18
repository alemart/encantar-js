document.addEventListener('DOMContentLoaded', () => {

    //
    // Open links in a new window
    //

    document.querySelectorAll('a._blank').forEach(link => {
        link.target = '_blank';
    });

    //
    // Support button
    //

    if(document.getElementById('splash'))
        return;

    const support = document.createElement('a');
    const heart = document.createElement('img');
    const text = document.createTextNode('Support me');

    heart.src = 'https://github.githubassets.com/images/icons/emoji/unicode/2764.png';
    heart.style.width = '24px';
    heart.style.paddingRight = '8px';
    heart.classList.add('gemoji', 'heart');

    support.href = 'https://alemart.github.io/encantar-js/support-my-work';
    support.target = '_blank';
    support.role = 'button';
    support.style.display = 'flex';
    support.style.alignItems = 'center';
    support.style.position = 'fixed';
    support.style.right = '16px';
    support.style.bottom = '16px';
    support.style.padding = '0 20px';
    support.style.height = '48px';
    support.style.color = 'var(--md-primary-fg-color)';
    support.style.backgroundColor = 'var(--md-primary-bg-color)';
    support.style.fontWeight = 'bold';
    support.style.fontSize = '16px';
    support.style.fontFamily = 'var(--md-text-font) sans-serif';
    support.style.cursor = 'pointer';
    support.style.borderWidth = '2px';
    support.style.borderStyle = 'solid';
    support.style.borderColor = 'var(--md-primary-fg-color)';
    support.style.borderRadius = '100px';
    support.style.transition = 'color 125ms,background-color 125ms,border-color 125ms';

    support.addEventListener('pointerenter', () => {
        support.style.backgroundColor = 'var(--md-accent-fg-color)';
        support.style.borderColor = 'var(--md-accent-fg-color)';
        support.style.color = 'var(--md-accent-bg-color)';
    });

    support.addEventListener('pointerleave', () => {
        support.style.backgroundColor = 'var(--md-primary-bg-color)';
        support.style.borderColor = 'var(--md-primary-fg-color)';
        support.style.color = 'var(--md-primary-fg-color)';
    });

    support.appendChild(heart);
    support.appendChild(text);
    document.body.appendChild(support);

});