// A library/utility for generating GIF files
// Uses Dean McNamee's omggif library
// and Anthony Dekker's NeuQuant quantizer (JS 0.3 version with many fixes)
//
// @author sole / http://soledadpenades.com
function Animated_GIF(options) {
    'use strict';

    options = options || {};

    var GifWriter = require('omggif').GifWriter;

    var width = options.width || 160;
    var height = options.height || 120;
    var dithering = options.dithering || null;
    var palette = options.palette || null;
    var canvas = null, ctx = null, repeat = 0, delay = 250;
    var frames = [];
    var numRenderedFrames = 0;
    var onRenderCompleteCallback = function() {};
    var onRenderProgressCallback = function() {};
    var sampleInterval;
    var workers = [], availableWorkers = [], numWorkers;
    var generatingGIF = false;

    // We'll try to be a little lenient with the palette so as to make the library easy to use
    // The only thing we can't cope with is having a non-array so we'll bail on that one.
    if(palette) {

        if(!(palette instanceof Array)) {

            throw('Palette MUST be an array but it is: ', palette);

        } else {

            // Now there are other two constraints that we will warn about
            // and silently fix them... somehow:

            // a) Must contain between 2 and 256 colours
            if(palette.length < 2 || palette.length > 256) {
                console.error('Palette must hold only between 2 and 256 colours');

                while(palette.length < 2) {
                    palette.push(0x000000);
                }

                if(palette.length > 256) {
                    palette = palette.slice(0, 256);
                }
            }

            // b) Must be power of 2
            if(!powerOfTwo(palette.length)) {
                console.error('Palette must have a power of two number of colours');

                while(!powerOfTwo(palette.length)) {
                    palette.splice(palette.length - 1, 1);
                }
            }

        }

    }

    options = options || {};
    sampleInterval = options.sampleInterval || 10;
    numWorkers = options.numWorkers || 2;

    for(var i = 0; i < numWorkers; i++) {
        var w = new Worker('./Animated_GIF.worker');
        workers.push(w);
        availableWorkers.push(w);
    }

    // ---

    // Return a worker for processing a frame
    function getWorker() {
        if(availableWorkers.length === 0) {
            throw ('No workers left!');
        }

        return availableWorkers.pop();
    }

    // Restore a worker to the pool
    function freeWorker(worker) {
        availableWorkers.push(worker);
    }

    // Faster/closurized bufferToString function
    // (caching the String.fromCharCode values)
    var bufferToString = (function() {
        var byteMap = [];
        for(var i = 0; i < 256; i++) {
            byteMap[i] = String.fromCharCode(i);
        }

        return (function(buffer) {
            var numberValues = buffer.length;
            var str = '';

            for(var i = 0; i < numberValues; i++) {
                str += byteMap[ buffer[i] ];
            }

            return str;
        });
    })();

    function startRendering(completeCallback) {
        var numFrames = frames.length;

        onRenderCompleteCallback = completeCallback;

        for(var i = 0; i < numWorkers && i < frames.length; i++) {
            processFrame(i);
        }
    }

    function processFrame(position) {
        var frame;
        var worker;

        frame = frames[position];

        if(frame.beingProcessed || frame.done) {
            console.error('Frame already being processed or done!', frame.position);
            onFrameFinished();
            return;
        }

        frame.sampleInterval = sampleInterval;
        frame.beingProcessed = true;

        worker = getWorker();

        worker.onmessage = function(ev) {
            var data = ev.data;

            // Delete original data, and free memory
            delete(frame.data);

            // TODO grrr... HACK for object -> Array
            frame.pixels = Array.prototype.slice.call(data.pixels);
            frame.palette = Array.prototype.slice.call(data.palette);
            frame.done = true;
            frame.beingProcessed = false;

            freeWorker(worker);

            onFrameFinished();
        };


        // TODO transfer objects should be more efficient
        /*var frameData = frame.data;
        //worker.postMessage(frameData, [frameData]);
        worker.postMessage(frameData);*/

        worker.postMessage(frame);
    }

    function processNextFrame() {

        var position = -1;

        for(var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            if(!frame.done && !frame.beingProcessed) {
                position = i;
                break;
            }
        }

        if(position >= 0) {
            processFrame(position);
        }
    }


    function onFrameFinished() { // ~~~ taskFinished

        // The GIF is not written until we're done with all the frames
        // because they might not be processed in the same order
        var allDone = frames.every(function(frame) {
            return !frame.beingProcessed && frame.done;
        });

        numRenderedFrames++;
        onRenderProgressCallback(numRenderedFrames * 0.75 / frames.length);

        if(allDone) {
            if(!generatingGIF) {
                generateGIF(frames, onRenderCompleteCallback);
            }
        } else {
            setTimeout(processNextFrame, 1);
        }

    }


    // Takes the already processed data in frames and feeds it to a new
    // GifWriter instance in order to get the binary GIF file
    function generateGIF(frames, callback) {

        // TODO: Weird: using a simple JS array instead of a typed array,
        // the files are WAY smaller o_o. Patches/explanations welcome!
        var buffer = []; // new Uint8Array(width * height * frames.length * 5);
        var globalPalette;
        var gifOptions = { loop: repeat };

        // Using global palette but only if we're also using dithering
        if(dithering !== null && palette !== null) {
            globalPalette = palette;
            gifOptions.palette = globalPalette;
        }

        var gifWriter = new GifWriter(buffer, width, height, gifOptions);

        generatingGIF = true;

        frames.forEach(function(frame, index) {

            var framePalette;

            if(!globalPalette) {
               framePalette = frame.palette;
            }

            onRenderProgressCallback(0.75 + 0.25 * frame.position * 1.0 / frames.length);
            gifWriter.addFrame(0, 0, width, height, frame.pixels, {
                palette: framePalette,
                delay: delay
            });
        });

        gifWriter.end();
        onRenderProgressCallback(1.0);

        frames = [];
        generatingGIF = false;

        callback(buffer);
    }


    function powerOfTwo(value) {
        return (value !== 0) && ((value & (value - 1)) === 0);
    }


    // ---

    this.setSize = function(w, h) {
        width = w;
        height = h;
        canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        ctx = canvas.getContext('2d');
    };

    // Internally, GIF uses tenths of seconds to store the delay
    this.setDelay = function(seconds) {
        delay = seconds * 0.1;
    };

    // From GIF: 0 = loop forever, null = not looping, n > 0 = loop n times and stop
    this.setRepeat = function(r) {
        repeat = r;
    };

    this.addFrame = function(element) {

        if(ctx === null) {
            this.setSize(width, height);
        }

        ctx.drawImage(element, 0, 0, width, height);
        var imageData = ctx.getImageData(0, 0, width, height);

        this.addFrameImageData(imageData);
    };

    this.addFrameImageData = function(imageData) {

        var dataLength = imageData.length,
            imageDataArray = new Uint8Array(imageData.data);

        frames.push({
            data: imageDataArray,
            width: imageData.width,
            height: imageData.height,
            palette: palette,
            dithering: dithering,
            done: false,
            beingProcessed: false,
            position: frames.length
        });
    };

    this.onRenderProgress = function(callback) {
        onRenderProgressCallback = callback;
    };

    this.isRendering = function() {
        return generatingGIF;
    };

    this.getBase64GIF = function(completeCallback) {

        var onRenderComplete = function(buffer) {
            var str = bufferToString(buffer);
            var gif = 'data:image/gif;base64,' + btoa(str);
            completeCallback(gif);
        };

        startRendering(onRenderComplete);

    };


    this.getBlobGIF = function(completeCallback) {

        var onRenderComplete = function(buffer) {
            var array = new Uint8Array(buffer);
            var blob = new Blob([ array ], { type: 'image/gif' });
            completeCallback(blob);
        };

        startRendering(onRenderComplete);

    };


    // Once this function is called, the object becomes unusable
    // and you'll need to create a new one.
    this.destroy = function() {

        // Explicitly ask web workers to die so they are explicitly GC'ed
        workers.forEach(function(w) {
            w.terminate();
        });

    };

}

// Not using the full blown exporter because this is supposed to be built
// into dist/Animated_GIF.js using a build step with browserify
module.exports = Animated_GIF;
