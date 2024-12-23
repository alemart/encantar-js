document.addEventListener('DOMContentLoaded', function() {

    //
    // Open links in a new window
    //

    document.querySelectorAll('a._blank').forEach(function(a) {
        a.target = '_blank';
    });

});