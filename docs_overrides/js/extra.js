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

    const sponsor = document.createElement('a');
    const heart = document.createElement('img');
    const text = document.createTextNode('Support me');

    heart.src = 'https://github.githubassets.com/images/icons/emoji/unicode/2764.png';
    heart.style.width = '24px';
    heart.style.paddingRight = '8px';
    heart.classList.add('gemoji', 'heart');

    sponsor.href = 'https://github.com/sponsors/alemart';
    sponsor.target = '_blank';
    sponsor.role = 'button';
    sponsor.style.display = 'flex';
    sponsor.style.alignItems = 'center';
    sponsor.style.position = 'fixed';
    sponsor.style.right = '16px';
    sponsor.style.bottom = '16px';
    sponsor.style.padding = '0 20px';
    sponsor.style.height = '48px';
    sponsor.style.color = 'var(--md-primary-fg-color)';
    sponsor.style.backgroundColor = 'var(--md-primary-bg-color)';
    sponsor.style.fontWeight = 'bold';
    sponsor.style.fontSize = '16px';
    sponsor.style.fontFamily = 'var(--md-text-font) sans-serif';
    sponsor.style.cursor = 'pointer';
    sponsor.style.borderWidth = '2px';
    sponsor.style.borderStyle = 'solid';
    sponsor.style.borderColor = 'var(--md-primary-fg-color)';
    sponsor.style.borderRadius = '100px';
    sponsor.style.transition = 'color 125ms,background-color 125ms,border-color 125ms';

    sponsor.addEventListener('pointerenter', () => {
        sponsor.style.backgroundColor = 'var(--md-accent-fg-color)';
        sponsor.style.borderColor = 'var(--md-accent-fg-color)';
        sponsor.style.color = 'var(--md-accent-bg-color)';
    });

    sponsor.addEventListener('pointerleave', () => {
        sponsor.style.backgroundColor = 'var(--md-primary-bg-color)';
        sponsor.style.borderColor = 'var(--md-primary-fg-color)';
        sponsor.style.color = 'var(--md-primary-fg-color)';
    });

    sponsor.appendChild(heart);
    sponsor.appendChild(text);
    document.body.appendChild(sponsor);

});