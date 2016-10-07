window.onload = function() {
	var srcImage = document.querySelector('img');
	var output = document.getElementById('output_images');
	var statusDiv = document.getElementById('status');

	var numIterations = 20;
	var i = 0;

	var width = srcImage.clientWidth;
	var height = srcImage.clientHeight;
	var lastTime = 0;

	generateImage();


	function generateImage() {

		var sampleInterval = Math.pow(2, i); // 1, 2, 4, 8, ...

		var ag = new Animated_GIF({
			repeat: null,
			sampleInterval: sampleInterval
		});

		lastTime = Date.now();

		ag.setSize(width, height);
		ag.addFrame(srcImage);

		ag.getBase64GIF(function(gif) {

			ag.destroy();

			var now = Date.now();
			var elapsed = ((now - lastTime) * 0.001).toFixed(2);
			var div = document.createElement('div');
			var statusText = 'Iteration ' + i + ', sampleInterval = ' + sampleInterval + ' / GIF length = ' + gif.length + ' elapsed = ' + elapsed;
			div.innerHTML = '<h3>' + statusText + '</h3>';

			statusDiv.innerHTML = statusText;

			var img = document.createElement('img');
			img.src = gif;

			div.appendChild(img);

			output.appendChild(div);
			window.scrollTo(0, document.body.clientHeight);

			i++;
			lastTime = now;

			if(i < numIterations) {
				setTimeout(generateImage, 0);
			}

		});
	}

};
