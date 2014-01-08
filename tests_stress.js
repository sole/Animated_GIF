window.onload = function() {

    var statusDiv = document.getElementById('status');
    var imagesDiv = document.getElementById('images');
    var canvasAnimation = document.getElementById('animation');
    var width = canvasAnimation.offsetWidth;
    var height = canvasAnimation.offsetHeight;

    var ctxAnimation = canvasAnimation.getContext('2d');
    var iterations = 0;

    captureGIF();

    function captureGIF() {

        iterations++;
        setStatus('capturing GIF ' + Date.now() + ' ' + iterations);

        
        var color = (((iterations * 0.01) * 0xFFFFFF) | 0) % 0xFFFFFF;
        console.log('color', color);

        ctxAnimation.fillStyle = '#' + color;
        ctxAnimation.fillRect(0, 0, width, height);

        var ag = new Animated_GIF({ repeat: null, workerPath: 'dist/Animated_GIF.worker.js' }); // Don't repeat
        ag.setSize(width, height);
        ag.addFrame(canvasAnimation);

        ag.getBase64GIF(function(gif) {
            var img = document.createElement('img');
            img.src = gif;
            imagesDiv.appendChild(img);
            setTimeout(captureGIF, 100);
        });


    }

    function setStatus(msg) {
        statusDiv.innerHTML = msg;
    }
};
