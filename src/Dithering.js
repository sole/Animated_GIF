var Dithering = (function() {

    'use strict';

    function colorClamp(value) {
        if(value < 0) return 0;
        else if(value > 255) return 255;

        return value;
    }

    var bayerMatrix8x8 = [
        [  1, 49, 13, 61,  4, 52, 16, 64 ],
        [ 33, 17, 45, 29, 36, 20, 48, 32 ],
        [  9, 57,  5, 53, 12, 60,  8, 56 ],
        [ 41, 25, 37, 21, 44, 28, 40, 24 ],
        [  3, 51, 15, 63,  2, 50, 14, 62 ],
        [ 35, 19, 47, 31, 34, 18, 46, 30 ],
        [ 11, 59,  7, 55, 10, 58,  6, 54 ],
        [ 43, 27, 39, 23, 42, 26, 38, 22 ]
    ];

    // int r, int g, int b, int[][] palette, int paletteLength
    function getClosestPaletteColorIndex(r, g, b, palette, paletteLength) {
        var minDistance = 195076;
        var diffR, diffG, diffB;
        var distanceSquared;
        var bestIndex = 0;
        var paletteChannels;

        for(var i = 0; i < paletteLength; i++) {

            paletteChannels = palette[i];
            diffR = r - paletteChannels[0];
            diffG = g - paletteChannels[1];
            diffB = b - paletteChannels[2];

            distanceSquared = diffR*diffR + diffG*diffG + diffB*diffB;

            if(distanceSquared < minDistance) {
                bestIndex = i;
                minDistance = distanceSquared;
            }

        }

        return bestIndex;
    }

    // TODO: inPixels -> inComponents or inColors or something more accurate
    function BayerDithering(inPixels, width, height, palette) {
        var offset = 0;
        var indexedOffset = 0;
        var r, g, b;
        var pixel, threshold, index;
        var paletteLength = palette.length;
        var matrix = bayerMatrix8x8;
        var indexedPixels = new Uint8Array( width * height );

        var modI = 8;
        var modJ = 8;

        for(var j = 0; j < height; j++) {
            var modj = j % modJ;

            for(var i = 0; i < width; i++) {

                threshold = matrix[i % modI][modj];

                r = colorClamp( inPixels[offset++] + threshold );
                g = colorClamp( inPixels[offset++] + threshold );
                b = colorClamp( inPixels[offset++] + threshold );

                index = getClosestPaletteColorIndex(r, g, b, palette, paletteLength);
                indexedPixels[indexedOffset++] = index;

            }
        }

        return indexedPixels;
    }


    function ClosestDithering(inPixels, width, height, palette) {

        var offset = 0;
        var indexedOffset = 0;
        var r, g, b;
        var index;
        var paletteLength = palette.length;
        var matrix = bayerMatrix8x8;
        var numPixels = width * height;
        var indexedPixels = new Uint8Array( numPixels );

        for(var i = 0; i < numPixels; i++) {

            r = inPixels[offset++];
            g = inPixels[offset++];
            b = inPixels[offset++];

            indexedPixels[i] = getClosestPaletteColorIndex(r, g, b, palette, paletteLength);

        }

        return indexedPixels;

    }


    function FloydSteinberg(inPixels, width, height, palette) {
        var paletteLength = palette.length;
        var offset = 0;
        var indexedOffset = 0;
        var r, g, b;
        var widthLimit = width - 1;
        var heightLimit = height - 1;
        var offsetNextI, offsetNextJ;
        var offsetPrevINextJ;
        var channels, nextChannels;
        var indexedPixels = new Uint8Array( width * height );

        for(var j = 0; j < height; j++) {
            for(var i = 0; i < width; i++) {

                r = colorClamp(inPixels[offset++]);
                g = colorClamp(inPixels[offset++]);
                b = colorClamp(inPixels[offset++]);

                var colorIndex = getClosestPaletteColorIndex(r, g, b, palette, paletteLength);
                var paletteColor = palette[colorIndex];
                var closestColor = paletteColor[3];

                // We are done with finding the best value for this pixel
                indexedPixels[indexedOffset] = colorIndex;

                // Now find difference between assigned value and original color
                // and propagate that error forward
                var errorR = r - paletteColor[0];
                var errorG = g - paletteColor[1];
                var errorB = b - paletteColor[2];

                if(i < widthLimit) {

                    offsetNextI = offset + 1;
                   
                    inPixels[offsetNextI++] += (errorR * 7) >> 4;
                    inPixels[offsetNextI++] += (errorG * 7) >> 4;
                    inPixels[offsetNextI++] += (errorB * 7) >> 4;

                }


                if(j < heightLimit) {

                    if(i > 0) {
                    
                        offsetPrevINextJ = offset - 1 + width;

                        inPixels[offsetPrevINextJ++] += (errorR * 3) >> 4;
                        inPixels[offsetPrevINextJ++] += (errorG * 3) >> 4;
                        inPixels[offsetPrevINextJ++] += (errorB * 3) >> 4;
                    
                    }

                    offsetNextJ = offset + width;

                    inPixels[offsetNextJ++] += (errorR * 5) >> 4;
                    inPixels[offsetNextJ++] += (errorG * 5) >> 4;
                    inPixels[offsetNextJ++] += (errorB * 5) >> 4;


                    if(i < widthLimit) {

                        inPixels[offsetNextJ++] += errorR >> 4;
                        inPixels[offsetNextJ++] += errorG >> 4;
                        inPixels[offsetNextJ++] += errorB >> 4;
                
                    }
                
                }

                indexedOffset++;
            }
        }

        return indexedPixels;
    }

    return {
        Bayer: BayerDithering,
        Closest: ClosestDithering,
        FloydSteinberg: FloydSteinberg
    };

})();
