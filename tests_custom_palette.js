window.onload = function() {
	var srcImage = document.querySelector('img');
	var output = document.getElementById('output_images');
	var statusDiv = document.getElementById('status');

	var i = 0;
    var palettes = [
        null,
        [ 0xFFFFFF, 0x000000 ],
        [ 0xFF0000, 0x00FF00, 0x0000FF, 0x000000 ],
        [ 0xFF0000, 0xFF00FF, 0xFFFFFF, 0x000000 ]
    ];

	var width = srcImage.clientWidth;
	var height = srcImage.clientHeight;
	var lastTime = 0;
	
	generateImage();


	function generateImage() {

		var ag = new Animated_GIF({
			repeat: null,
			workerPath: 'dist/Animated_GIF.worker.js',
            palette: palettes[i]
		});

		lastTime = Date.now();

		ag.setSize(width, height);
		ag.addFrame(srcImage);

		ag.getBase64GIF(function(gif) {

			ag.destroy();

			var now = Date.now();
			var elapsed = ((now - lastTime) * 0.001).toFixed(2);
			var div = document.createElement('div');
            // TODO: render palette swatches too
			var statusText = 'Iteration ' + i + ' / GIF length = ' + gif.length + ' elapsed = ' + elapsed;
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
				setTimeout(generateImage, 0);
			}

		});
	}

};
