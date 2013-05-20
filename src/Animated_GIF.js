// A library/utility for generating GIF files
// Uses Dean McNamee's omggif library
// and Anthony Dekker's NeuQuant quantizer (JS 0.3 version with many fixes)
//
// @author sole / http://soledadpenades.com
function Animated_GIF() {
    var width = 160, height = 120, canvas = null, ctx = null, repeat = 0, delay = 250;
    var buffer, gifWriter, pixels, numFrames, maxNumFrames = 100;
    var currentPalette, currentPaletteArray, currentPaletteComponents, maxNumColors = 256;

    function allocateResources() {
        var total = maxNumFrames;

        numFrames = 0;
        buffer = new Uint8Array( width * height * total * 5 );
        gifWriter = new GifWriter( buffer, width, height, { loop: repeat } );
        pixels = new Uint8Array( width * height );
        currentPalette = null;
    }

    this.setSize = function(w, h) {
        width = w;
        height = h;
        canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        ctx = canvas.getContext('2d');
        allocateResources();
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
        if( numFrames >= maxNumFrames ) {
            return;
        }

        ctx.drawImage(element, 0, 0, width, height);
        data = ctx.getImageData(0, 0, width, height);

        this.addFrameImageData(data);
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

    this.getGIF = function() {
        var numberValues = gifWriter.end();
        var str = '';

        for(var i = 0; i < numberValues; i++) {
            str += String.fromCharCode( buffer[i] );
        }

        return str;
    };

    this.getB64GIF = function() {
        return 'data:image/gif;base64,' + btoa(this.getGIF());
    };


    // ---
    
    this.setSize(width, height);

}
