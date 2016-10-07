window.onload = function() {

    var imgs = document.querySelectorAll('img');
    var firstImage = imgs[0];
    var imageWidth = firstImage.clientWidth;
    var imageHeight = firstImage.clientHeight;
    var tasks = [];
    var status = document.getElementById('status');


    function buildImageCallback(img) {
        return function(gif) {
            img.src = gif;
        };
    }


    function getBuildGIFTask(img) {
        return function(doneCallback) {
            var ag = new Animated_GIF({
                repeat: null, // Don't repeat
            });
            ag.setSize(img.clientWidth, img.clientHeight);
            ag.addFrame(img);

            var img2 = document.createElement('img');
            if(img.nextSibling) {
                img.parentNode.insertBefore(img2, img.nextSibling);
            } else {
                img.parentNode.appendChild(img2);
            }

            ag.getBase64GIF(function(gif) {
                var originalSrc = img.src;
                img.addEventListener('mouseenter', function() {
                    img.src = gif;
                }, false);
                img.addEventListener('mouseleave', function() {
                    img.src = originalSrc;
                }, false);
                doneCallback();
            });


        };
    }


    function runTasks(tasks) {

        var nextTaskIndex = 0;

        runNextTask();

        //

        function runNextTask() {

            if(nextTaskIndex < tasks.length) {

                console.log('running task', nextTaskIndex);
                var task = tasks[nextTaskIndex];
                task(function() {
                    nextTaskIndex++;
                    setTimeout(runNextTask, 100);
                });

            }

        }

    }

    //

    tasks.push(function(doneCallback) {

        var agAll = new Animated_GIF({
            repeat: 0, // repeat 0 = Repeat forever
        });
        agAll.setSize(imageWidth, imageHeight);
        agAll.setDelay(1000);

        for(var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            agAll.addFrame(img);
        }

        var imgAll = document.createElement('img');
        var lastRenderProgress = Date.now();

        agAll.onRenderProgress(function(progress) {
            var t = Date.now();
            var elapsed = t - lastRenderProgress;
            lastRenderProgress = t;
            status.innerHTML = (new Date().toISOString() + ' elapsed ' + elapsed + ' ms');
        });

        agAll.getBase64GIF(function(image) {
            imgAll.src = image;
            doneCallback();
        });

        imgAll.style.display = 'block';

        document.getElementById('sample_image').appendChild(imgAll);

    });


    for(var i = 0; i < imgs.length; i++) {
        tasks.push(getBuildGIFTask(imgs[i]));
    }


    runTasks(tasks, function() {
        status.innerHTML = 'All done!';
    });

};

