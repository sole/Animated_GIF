// A library/utility for generating GIF files
// Uses Dean McNamee's omggif library
// and Anthony Dekker's NeuQuant quantizer (JS 0.3 version with many fixes)
//
// @author sole / http://soledadpenades.com
function Animated_GIF(options) {
    'use strict';

    var width = 160, height = 120, canvas = null, ctx = null, repeat = 0, delay = 250;
    var frames = [];
    var onRenderCompleteCallback = function() {};
    var workers = [], availableWorkers = [], numWorkers, workerPath;
    var generatingGIF = false;

    options = options || {};
    numWorkers = options.numWorkers || 2;
    workerPath = options.workerPath || 'src/quantizer.js'; // XXX hardcoded path

    for(var i = 0; i < numWorkers; i++) {
        var w = new Worker(workerPath);
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

    function render(completeCallback) {
        var numFrames = frames.length;

        onRenderCompleteCallback = completeCallback;

        for(var i = 0; i < numWorkers && i < frames.length; i++) {
            console.log('setting initial work load', i);
            processFrame(i);
        }
    }

    function processFrame(position) {
        console.log('processFrame', position);
        var frame;
        var worker;

        frame = frames[position];
        
        if(frame.beingProcessed || frame.done) {
            console.error('Frame already being processed or done!', frame.position);
            onFrameFinished();
            return;
        }

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

        
        // TODO maybe look into transfer objects
        // for further efficiency
        var frameData = frame.data;
        //worker.postMessage(frameData, [frameData]);
        worker.postMessage(frameData);
    }

    function processNextFrame() {

        console.log('processNextFrame');

        var position = -1;

        for(var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            if(!frame.done && !frame.beingProcessed) {
                position = i;
                break;
            }
        }
        
        console.log('the next frame to process', position);

        if(position >= 0) {
            processFrame(position);
        } else {
            //console.error('HUH');
            //finishGIF();
            onFrameFinished();
        }
    }

    function onFrameFinished() { // ~~~ taskFinished

        console.log('--- frame finished ---');

        // The GIF is not written until we're done with all the frames
        // because they might not be processed in the same order
        var allDone = frames.every(function(frame) {
            console.log('frame check', frame.position, 'P', frame.beingProcessed, 'D', frame.done);
            return !frame.beingProcessed && frame.done;
        });

        console.log('allDone?', allDone);
        
        if(allDone) {
            finishGIF();
        } else {
            setTimeout(processNextFrame, 1);
        }
        
    }

    function finishGIF() {
        if(generatingGIF === false) {
            generateGIF(frames, onRenderCompleteCallback);
        } else {
            console.log('gif already being generated');
        }
    }

    function generateGIF(frames, callback) {
        console.log('generate GIF', frames.length);
        var buffer = new Uint8Array(width * height * frames.length * 5);
        var gifWriter = new GifWriter(buffer, width, height, { loop: repeat });

        generatingGIF = true;

        frames.forEach(function(frame) {
            console.log('generate GIF', frame.position, frame.done);
            gifWriter.addFrame(0, 0, width, height, frame.pixels, {
                palette: frame.palette, 
                delay: delay 
            });
        });

        gifWriter.end();
        
        frames = [];

        callback(buffer);
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

    this.setDelay = function(d) {
        delay = d;
    };

    this.setRepeat = function(r) {
        repeat = r;
    };

    this.setMaxNumColors = function(v) {
        maxNumColors = v;
    };

    this.addFrame = function(element) {

        if(ctx === null) {
            this.setSize(width, height);
        }

        ctx.drawImage(element, 0, 0, width, height);
        var data = ctx.getImageData(0, 0, width, height);
        
        this.addFrameImageData(data.data);
    };

    this.addFrameImageData = function(imageData) {

        var dataLength = imageData.length,
            imageDataArray = new Uint8Array(imageData);

        frames.push({ data: imageDataArray, done: false, beingProcessed: false, position: frames.length });
    };

    this.getBase64GIF = function(completeCallback) {

        var onRenderComplete = function(buffer) {
            console.log('rendering complete');
            var str = bufferToString(buffer);
            var gif = 'data:image/gif;base64,' + btoa(str);
            completeCallback(gif);
        };

        render(onRenderComplete);

    };

}
