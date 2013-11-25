cat NeuQuant.js quantizer.js > ../dist/Animated_GIF.worker.js
browserify main.js > ../dist/Animated_GIF.js

# minified versions too
uglifyjs ../dist/Animated_GIF.js > ../dist/Animated_GIF.min.js
uglifyjs ../dist/Animated_GIF.worker.js > ../dist/Animated_GIF.worker.min.js
