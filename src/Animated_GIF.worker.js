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

// ~~~

function run(frame) {
    var data = frame.data;
    var width = frame.width;
    var height = frame.height;
    var palette = frame.palette;
    var length = Object.keys(data).length; // !!! TODO width * height * 4?
    var numberPixels = length / 4; // 4 components = rgba
    var sampleInterval = frame.sampleInterval;
    var bgrPixels = [];
    var offset = 0;
    var r, g, b;
    //var pixels = new Uint8Array(numberPixels); // it's an indexed image so 1 byte per pixel is enough

    /*// extract RGB values into BGR for the quantizer
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

    // Create reduced palette first, using a quantizer
    var paletteBGR = nq.process();
    var palette = [];

    for(var i = 0; i < paletteBGR.length; i += 3) {
        b = paletteBGR[i];
        g = paletteBGR[i+1];
        r = paletteBGR[i+2];
        palette.push(r << 16 | g << 8 | b);
    }
    var paletteArray = new Uint32Array(palette);

    // Then map each original pixel to the closest colour in the palette
    var k = 0;
    for (var j = 0; j < numberPixels; j++) {
        b = bgrPixels[k++];
        g = bgrPixels[k++];
        r = bgrPixels[k++];
        var index = nq.map(b, g, r);
        pixels[j] = index;
    }*/

    // Extract component values from data
    var rgbComponents = dataToRGB( data, width, height );

    // Build palette or use provided
    // IMPORTANT: MAKE SURE PALETTE IS A POWER OF TWO 2..256
    // var palette = [ 0xFF000000, 0xFFFF0000, 0xFF00FF00, 0xFFFFFFFF ]; // TMP
    
    if(palette === null) {

    }

    // TODO 2..256 palette


    var paletteArray = new Uint32Array( palette );
    var paletteChannels = channelizePalette( palette );

    // Convert RGB image to indexed image
    pixels = Dithering.Bayer(rgbComponents, width, height, paletteChannels);

    return ({
        pixels: pixels,
        palette: paletteArray
    });
}

self.onmessage = function(ev) {
    var data = ev.data;
    var response = run(data);
    postMessage(response);
};
