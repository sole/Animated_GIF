var NeuQuant = require('./lib/NeuQuant');
var Dithering = require('node-dithering');

function channelizePalette( palette ) {
    var channelizedPalette = [];

    for(var i = 0; i < palette.length; i++) {
        var color = palette[i];

        var r = (color & 0xFF0000) >> 16;
        var g = (color & 0x00FF00) >>  8;
        var b = (color & 0x0000FF);

        channelizedPalette.push([ r, g, b, color ]);
    }

    return channelizedPalette;

}


function dataToRGB( data, width, height ) {
    var i = 0;
    var length = width * height * 4;
    var rgb = [];

    while(i < length) {
        rgb.push( data[i++] );
        rgb.push( data[i++] );
        rgb.push( data[i++] );
        i++; // for the alpha channel which we don't care about
    }

    return rgb;
}


function componentizedPaletteToArray(paletteRGB) {

    var paletteArray = [];

    for(var i = 0; i < paletteRGB.length; i += 3) {
        var r = paletteRGB[ i ];
        var g = paletteRGB[ i + 1 ];
        var b = paletteRGB[ i + 2 ];
        paletteArray.push(r << 16 | g << 8 | b);
    }

    return paletteArray;
}


// This is the "traditional" Animated_GIF style of going from RGBA to indexed color frames
function processFrameWithQuantizer(imageData, width, height, sampleInterval) {

    var rgbComponents = dataToRGB( imageData, width, height );
    var nq = new NeuQuant(rgbComponents, rgbComponents.length, sampleInterval);
    var paletteRGB = nq.process();
    var paletteArray = new Uint32Array(componentizedPaletteToArray(paletteRGB));

    var numberPixels = width * height;
    var indexedPixels = new Uint8Array(numberPixels);

    var k = 0;
    for(var i = 0; i < numberPixels; i++) {
        r = rgbComponents[k++];
        g = rgbComponents[k++];
        b = rgbComponents[k++];
        indexedPixels[i] = nq.map(r, g, b);
    }

    return {
        pixels: indexedPixels,
        palette: paletteArray
    };

}


// And this is a version that uses dithering against of quantizing
// It can also use a custom palette if provided, or will build one otherwise
function processFrameWithDithering(imageData, width, height, ditheringType, palette) {

    // Extract component values from data
    var rgbComponents = dataToRGB( imageData, width, height );


    // Build palette if none provided
    if(palette === null) {

        var nq = new NeuQuant(rgbComponents, rgbComponents.length, 16);
        var paletteRGB = nq.process();
        palette = componentizedPaletteToArray(paletteRGB);

    }

    var paletteArray = new Uint32Array( palette );
    var paletteChannels = channelizePalette( palette );

    // Convert RGB image to indexed image
    var ditheringFunction;

    if(ditheringType === 'closest') {
        ditheringFunction = Dithering.Closest;
    } else if(ditheringType === 'floyd') {
        ditheringFunction = Dithering.FloydSteinberg;
    } else {
        ditheringFunction = Dithering.Bayer;
    }

    pixels = ditheringFunction(rgbComponents, width, height, paletteChannels);

    return ({
        pixels: pixels,
        palette: paletteArray
    });

}


// ~~~

function run(frame) {
    var width = frame.width;
    var height = frame.height;
    var imageData = frame.data;
    var dithering = frame.dithering;
    var palette = frame.palette;
    var sampleInterval = frame.sampleInterval;

    if(dithering) {
        return processFrameWithDithering(imageData, width, height, dithering, palette);
    } else {
        return processFrameWithQuantizer(imageData, width, height, sampleInterval);
    }

}


self.onmessage = function(ev) {
    var data = ev.data;
    var response = run(data);
    postMessage(response);
};
