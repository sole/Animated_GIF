# Animated_GIF

_A Javascript library for creating animated GIFs_

## How to use it?

Include `dist/Animated_GIF.js` in your HTML.

```javascript
var imgs = document.querySelectorAll('img');

// change workerPath to point to where Animated_GIF.worker.js is
var ag = new Animated_GIF({ workerPath: 'dist/Animated_GIF.worker.js' }); 
ag.setSize(320, 240);

for(var i = 0; i < imgs.length; i++) {
    ag.addFrame(imgs[i]);
}

var animatedImage = document.createElement('img');

// This is asynchronous, rendered with WebWorkers
ag.getBase64GIF(function(image) {
    animatedImage.src = image;
    document.body.appendChild(animatedImage);
});

```

If you instance lots of `Animated_GIF` objects, it's strongly recommended that you call their `destroy` method once you're done rendering the GIFs, as browsers don't seem to be happy otherwise. See the [stress test](tests_stress.html) for an example of this in use!

## Minified versions

You can also use the minified versions in `dist/`: `dist/Animated_GIF.min.js`. Remember to set the worker path to `dist/Animated_GIF.worker.min.js`!

## Tests and examples

Check the tests_* files:

* [Basic](http://sole.github.io/Animated_GIF/tests_basic.html)
* [Stress](http://sole.github.io/Animated_GIF/tests_stress.html)

## See it in action

Some sites and apps using it:

* [chat.meatspac.es](http://chat.meatspac.es)
* [rtcamera](http://rtcamera.apps.5013.es/)

## Credits

* Anthony Dekker's [NeuQuant](http://members.ozemail.com.au/~dekker/NEUQUANT.HTML) image quantization algorithm which was ported from C into Java by Kevin Weiner and then to [ActionScript 3](http://www.bytearray.org/?p=93) by Thibault Imbert, and to [JavaScript](http://antimatter15.com/wp/2010/07/javascript-to-animated-gif/) by antimatter15, and fixed, patched and revised by [sole](http://soledadpenades.com).
* Dean McNamee's [omggif](https://github.com/deanm/omggif) library - for actually encoding into GIF89
