window.onload = function() {
	var srcImage = document.querySelector('img');
	var output = document.getElementById('output_images');
	var statusDiv = document.getElementById('status');
	var ditheringTypes = [ null, 'closest', 'bayer', 'floyd' ];

	var i = 0;
	var width = srcImage.clientWidth;
	var height = srcImage.clientHeight;
	var lastTime = 0;

	generateImage();

	// ---

	function generateImage() {

		var dithering = ditheringTypes[i];

		var ag = new Animated_GIF({
			repeat: null,
            palette: [ 0x000000, 0xFFFFFF ], // Using a very simple black and white palette
			dithering: dithering
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

			if(i < ditheringTypes.length) {
				setTimeout(generateImage, 1);
			}
		});
	}


	function getStatusText(index, gif, elapsed) {
		// TODO: render palette swatches too
		return  'dithering =  ' + ditheringTypes[index] + ' / GIF length = ' + toKB(gif.length) + ' elapsed = ' + elapsed;
	}


    function toKB(size) {
        return Math.round(size / 1024) + ' kB';
    }

};
