window.onload = function() {

    var statusDiv = document.getElementById('status');
    var imagesDiv = document.getElementById('images');
    var canvasAnimation = document.getElementById('animation');
    var ctxAnimation = canvasAnimation.getContext('2d');
    var iterations = 0;

    captureGIF();

    function captureGIF() {
        iterations++;
        setStatus('capturing GIF ' + Date.now() + ' ' + iterations);

        var width = cssAnimation.offsetWidth;
        var height = cssAnimation.offsetHeight;

        var captureCanvas = document.createElement('canvas');
        var ctx = captureCanvas.getContext('2d');
        
        captureCanvas.width = width;
        captureCanvas.height = height;

        ctx.drawImage(cssAnimation, 0, 0);

        var ag = new Animated_GIF({ repeat: null, workerPath: 'dist/Animated_GIF.worker.js' }); // Don't repeat
        ag.setSize(width, height);
        ag.addFrame(captureCanvas);

        ag.getBase64GIF(function(gif) {
            var img = document.createElement('img');
            img.src = gif;
            imagesDiv.appendChild(img);
            setTimeout(captureGIF, 1000);
        });




    }

    function setStatus(msg) {
        statusDiv.innerHTML = msg;
    }
};
