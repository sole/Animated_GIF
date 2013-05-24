// A library/utility for generating GIF files
// Uses Dean McNamee's omggif library
// and Anthony Dekker's NeuQuant quantizer (JS 0.3 version with many fixes)
//
// @author sole / http://soledadpenades.com
function Animated_GIF() {
    var width = 160, height = 120, canvas = null, ctx = null, repeat = 0, delay = 250;
    var buffer, gifWriter; //, pixels; /*numFrames, maxNumFrames = 100,*/
    var queuedFrames = [];
    var onRenderCompleteCallback = function() {};
    //var currentPalette, currentPaletteArray, currentPaletteComponents, maxNumColors = 256;

    function allocateResources(numFrames) {
        //var total = maxNumFrames;

        //numFrames = 0; // XXX
        buffer = new Uint8Array( width * height * numFrames * 5 );
        gifWriter = new GifWriter( buffer, width, height, { loop: repeat } );
        //pixels = new Uint8Array( width * height );
        //currentPalette = null;
        //queuedFrames = [];
    }

    this.setSize = function(w, h) {
        width = w;
        height = h;
        canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        ctx = canvas.getContext('2d');
        // allocateResources();
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

        ctx.drawImage(element, 0, 0, width, height);
        data = ctx.getImageData(0, 0, width, height);

        // this.addFrameImageData(data);
        var imageData = data.data,
            dataLength = imageData.length,
            //dataBuffer = new ArrayBuffer( dataLength / 4 ),
            //imageDataArray = new Uint8Array( dataBuffer ),
            //imageDataArray = new Uint8Array( dataLength ),
            imageDataArray = new Uint8Array( imageData ),
            i = 0;

        /*while(i < dataLength) {
            imageDataArray[i++] = imageData[i];
        }*/
        
        queuedFrames.push({ data: imageDataArray, done: false, position: queuedFrames.length });
    };

    this.addFrameImageData = function(imageData) {
        var data = imageData.data;
        var length = data.length;
        var numberPixels = length / 4; // 4 components = rgba
        var sampleInterval = 10;
        var bgrPixels = [];
        var offset = 0;
        var i, r, g, b;

        // extract RGB values into BGR for the quantizer
        while(offset < length) {
            r = data[offset++];
            g = data[offset++];
            b = data[offset++];
            bgrPixels.push(b);
            bgrPixels.push(g);
            bgrPixels.push(r);
            
            offset++;
        }
        
        var nq = new NeuQuant(bgrPixels, bgrPixels.length, sampleInterval);

        var paletteBGR = nq.process(); // create reduced palette
        var palette = [];

        for(i = 0; i < paletteBGR.length; i+=3) {
            b = paletteBGR[i];
            g = paletteBGR[i+1];
            r = paletteBGR[i+2];
            palette.push(r << 16 | g << 8 | b);
        }
        var paletteArray = new Uint32Array(palette);

        var k = 0;
        for (var j = 0; j < numberPixels; j++) {
            b = bgrPixels[k++];
            g = bgrPixels[k++];
            r = bgrPixels[k++];
            var index = nq.map(b, g, r);
            pixels[j] = index;
        }
        
        gifWriter.addFrame(0, 0, width, height, pixels, { palette: paletteArray, delay: delay });

    };

    this.render = function(completeCallback) {
        // TODO allocateResources(); // TODO
        // pixels[] -> in each 'worker'
        // buffer, gifWriter -> in main
        
        var numFrames = queuedFrames.length;

        onRenderCompleteCallback = completeCallback;
        buffer = new Uint8Array(width * height * numFrames * 5);
        gifWriter = new GifWriter(buffer, width, height, { loop: repeat });


        // TODO detect web worker support, fallback appropriately
        processNextFrame(0);
        
    };

    
    function processNextFrame(position) {

        console.log('processNextFrame', position);
        var frame = queuedFrames[position];
        var worker = new Worker('./src/quantizer.js'); // TODO not hardcoded path
        
        worker.onmessage = function(ev) {
            console.log('from the worker', ev.data);
            var data = ev.data;

            // TODO grrr... HACK for object -> Array
            frame.pixels = Array.prototype.slice.call(data.pixels);
            frame.palette = Array.prototype.slice.call(data.palette);
            frame.done = true;
            onFrameFinished(frame);
        };

        // TODO maybe look into transfer objects
        // for further efficiency
        //worker.postMessage(frame);
        var frameData = frame.data;
        console.log('FRAME DATA', frameData);
        //worker.postMessage(frameData, [frameData]);
        worker.postMessage(frameData);
        
    }

    function onFrameFinished(frame) {

        console.log('onFrameFinished', frame.pixels.length, frame.palette.length);
        
        gifWriter.addFrame(0, 0, width, height, frame.pixels, { palette: frame.palette, delay: delay });
        // TODO: and what about freeing the frame? that could actually be a good idea

        console.log('frame finished', frame.position);

        if(frame.position === queuedFrames.length - 1) {
            gifWriter.end();
            onRenderCompleteCallback(buffer);
        } else {
            setTimeout(function() {
                processNextFrame(frame.position + 1);
            });
        }
        
    }

    /*this.getGIF = function() {
        var numberValues = gifWriter.end();
        var str = '';

        for(var i = 0; i < numberValues; i++) {
            str += String.fromCharCode( buffer[i] );
        }

        return str;
    };*/

    // TODO I like better the 'event emitter' approach for events, rendering etc

    this.bufferToString = function(buffer) {
        var numberValues = buffer.length;
        var str = '';
console.log('bufferToString', numberValues);
        for(var i = 0; i < numberValues; i++) {
            str += String.fromCharCode( buffer[i] );
        }

        return str;
    };

    this.getBase64GIF = function(completeCallback) {
        var self = this;

        this.render(function(buffer) {
            console.log('rendering complete');
            var str = self.bufferToString(buffer);
            var gif = 'data:image/gif;base64,' + btoa(str);
            completeCallback(gif);
        });
    };


    // ---
    
    this.setSize(width, height);

}
