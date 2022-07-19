window.onload = function () {

    var imgs = document.querySelectorAll('img');
    var firstImage = imgs[0];
    var imageWidth = firstImage.clientWidth;
    var imageHeight = firstImage.clientHeight;
    var delayInputs = document.querySelectorAll('.delay');
    var status = document.getElementById('status');
    var output_image = document.getElementById('sample_image');
    var ag;

    buildGIF();

    for (var i = 0; i < delayInputs.length; i++) {
        var delayInput = delayInputs[i];
        delayInput.onchange = function () {
            if (ag) {
                ag.destroy && ag.destroy();
            }
            buildGIF();
        }
    }

    function buildGIF () {
        status.innerHTML = '';
        ag = new Animated_GIF();
        ag.setSize(imageWidth, imageHeight);

        for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            var delay = Math.max(Number(delayInputs[i].value), 100);
            ag.addFrame(img, { delay: delay });
        }
        ag.getBase64GIF(function (gif) {
            var gifImg = document.createElement('img'); 
            gifImg.src = gif;
            gifImg.style.display = 'block';
            output_image.innerHTML = '';
            output_image.appendChild(gifImg);
            status.innerHTML = 'All done!';
        });
    }
};

