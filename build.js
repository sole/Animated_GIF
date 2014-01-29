// Builds the dist/ folder sources for browser usage.
'use strict';

var fs = require('fs');
var browserify = require('browserify')();
var uglify = require('uglify-js');

function readSrc(file) {
  return fs.readFileSync(require.resolve('./src/' + file));
}

function writeDist(file, contents) {
  fs.writeFileSync(require.resolve('./dist/' + file), contents, { encoding: 'utf8' });
}

// Build Animated_GIF.js
browserify.add(require.resolve('./src/main.js'));
browserify.bundle(function (err, src) {
  var minified = uglify.minify(src, { fromString: true });
  writeDist('Animated_GIF.js', src);
  writeDist('Animated_GIF.min.js', minified.code);
});

// Build Animated_GIF.worker.js
var worker = readSrc('./lib/NeuQuant.js');
worker += readSrc('Dithering.js');
worker += readSrc('Animated_GIF.worker.js');
var minifiedWorker = uglify.minify(worker, { fromString: true });
writeDist('Animated_GIF.worker.js', worker);
writeDist('Animated_GIF.worker.min.js', minifiedWorker.code);
