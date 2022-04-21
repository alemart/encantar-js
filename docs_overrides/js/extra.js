window.addEventListener('load', () => {

    //
    // Open links in a new window
    //

    document.querySelectorAll('a._blank').forEach(link => {
        link.target = '_blank';
    });

});