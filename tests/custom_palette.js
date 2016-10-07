window.onload = function() {
	var srcImage = document.querySelector('img');
	var srcImages = document.querySelectorAll('img');
	var output = document.getElementById('output_images');
	var statusDiv = document.getElementById('status');

	var i = 0;
	var palettes = [
		null,
		[ 0xFFFFFF, 0x000000 ],
		[ 0xFF0000, 0x00FF00, 0x0000FF, 0x000000 ],
		[ 0xFF0000, 0xFF00FF, 0xFFFFFF, 0x000000 ],
		[ 0xFF000000, 0xFF55FF55, 0xFFFF5555, 0xFFFFFF55 ], // CGA mode 0
		[ 0xFF000000, 0xFF55FFFF, 0xFFFF55FF, 0xFFFFFFFF ], // CGA mode 1
		[ 0xFF000000, 0xFF0000AA, 0xFF00AA00, 0xFF00AAAA, 0xFFAA0000, 0xFFAA00AA, 0xFFAA5500, 0xFFAAAAAA, 0xFF555555, 0xFF5555FF, 0xFF55FF55, 0xFF55FFFF, 0xFFFF5555, 0xFFFF55FF, 0xFFFFFF55, 0xFFFFFFFF ], // EGA
		[ 0xFF0000, 0xFF00FF, 0xFFFFFF ], // Faulty palette without power of two colours
		[ 0xFF0000 ], // Faulty with less than 2 colours
		];

	var width = srcImage.clientWidth;
	var height = srcImage.clientHeight;
	var lastTime = 0;


    // We'll start by generating static one frame versions of the first image
    // using different palettes
    // Then when that's done we'll build 3 frame gifs with different palettes
	generateImage();


	function generateImage() {

		var ag = new Animated_GIF({
			repeat: null,
            palette: palettes[i],
			dithering: 'bayer'
		});

		lastTime = Date.now();

		ag.setSize(width, height);
		ag.addFrame(srcImage);

		ag.getBase64GIF(function(gif) {

			ag.destroy();

			var now = Date.now();
			var elapsed = ((now - lastTime) * 0.001).toFixed(2);
			var div = document.createElement('div');
			var statusText = getStatusText(i, gif, elapsed);
			div.innerHTML = '<h3>' + statusText + '</h3>';

			statusDiv.innerHTML = statusText;

			var img = document.createElement('img');
			img.src = gif;

			div.appendChild(img);

			output.appendChild(div);
			window.scrollTo(0, document.body.clientHeight);

			i++;
			lastTime = now;

			if(i < palettes.length) {
				setTimeout(generateImage, 1);
			} else {
				i = 0;
				setTimeout(generateAnimatedImage, 1);
			}

		});
	}

	function generateAnimatedImage() {

		var ag = new Animated_GIF({
			repeat: 0,
			palette: palettes[i],
			dithering: 'bayer'
		});

		lastTime = Date.now();

		ag.setSize(width, height);

		for(var k = 0; k < srcImages.length; k++) {
			ag.addFrame(srcImages[k]);
		}

		ag.getBase64GIF(function(gif) {

			ag.destroy();

			var now = Date.now();
			var elapsed = ((now - lastTime) * 0.001).toFixed(2);
			var div = document.createElement('div');

			var statusText = getStatusText(i, gif, elapsed);
			div.innerHTML = '<h3>' + statusText + '</h3>';

			statusDiv.innerHTML = statusText;

			var img = document.createElement('img');
			img.src = gif;

			div.appendChild(img);

			output.appendChild(div);
			window.scrollTo(0, document.body.clientHeight);

			i++;
			lastTime = now;

			if(i < palettes.length) {
                setTimeout(generateAnimatedImage, 1);
			}

		});
	}

	function getStatusText(paletteIndex, gif, elapsed) {
		// TODO: render palette swatches too
		return  'Palette ' + paletteIndex + ' / GIF length = ' + toKB(gif.length) + ' elapsed = ' + elapsed;
	}


	function toKB(size) {
		return Math.round(size / 1024) + ' kB';
	}

};
