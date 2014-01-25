var Dithering = (function() {

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

	// int[] inPixels, int[] outPixels, int width, int height, int[][] palette
    // TODO: inPixels -> inComponents or inColors or something more accurate
	function BayerDithering(inPixels, /* outPixels,*/ width, height, palette) {
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

				/*pixel = inPixels[offset];

				r = colorClamp(pixel[0] + threshold);
				g = colorClamp(pixel[1] + threshold);
				b = colorClamp(pixel[2] + threshold);*/

                r = colorClamp( inPixels[offset++] + threshold );
                g = colorClamp( inPixels[offset++] + threshold );
                b = colorClamp( inPixels[offset++] + threshold );

				index = getClosestPaletteColorIndex(r, g, b, palette, paletteLength);
				// outPixels[offset] = palette[index][3];
                indexedPixels[indexedOffset++] = index;

			}
		}

        return indexedPixels;
	}

	return {
		Bayer: BayerDithering
	};

})();
