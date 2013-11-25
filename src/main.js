(function() {

    var Animated_GIF = require('./Animated_GIF');

    // Supposedly should make the bundle compatible with require.js
    if(typeof define === 'function' && define.amd) {
        define(function() { return Animated_GIF; });
    } else {
        // Otherwise just tuck it into the window object
        window.Animated_GIF = Animated_GIF;
    }

}).call(this);
