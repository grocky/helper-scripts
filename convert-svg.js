#!/usr/bin/env node
'use strict';

var common = require('./common');

var script = common.commander
    .version('0.0.1')
    .description('create a png from an svg using ImageMagick')
    .arguments('<svg-file>')
    .option('-W, --width <int>', 'The width to resize. If --height is not given, it will be calculated proportional the original size', parseInt)
    .option('-H, --height <int>', 'The height to resize. If --width is not given, it will be calculated proportional the original size', parseInt)
    .option('-F, --filename <filename>', 'The name of the resulting file. Defaults to <filename>-<W>x<H>.png')
    .parse(process.argv);

var filename = script.args[0];
if (typeof filename === 'undefined') {
    console.error('    No svg-file given!'.error);
    process.exit(1);
}

var toWidth = script.width;
var toHeight = script.height;
var toName = script.filename;

convertSvgToPng(filename, toWidth, toHeight, toName, function (error, result) {
    if (error) {
        console.error(JSON.stringify(error, null, 2).error);
        process.exit(error.code);
    }
    console.info('done');
});

function convertSvgToPng(filename, toWidth, toHeight, toName, callback) {

    var args = [].slice.call(arguments);

    filename = args.shift();
    callback = callback || args.pop();
    toWidth = args.shift() || null;
    toHeight = args.shift() || null;
    toName = args.shift() || null;

    getFileInfo(filename, function(error, fileInfo) {

        if (error) callback(error);

        if (toWidth === null && toHeight === null) {
            toWidth = fileInfo.width;
            toHeight = fileInfo.height;
        }

        if (toWidth === null) {
            toWidth = Math.floor(fileInfo.width / fileInfo.height * toHeight);
        }

        if (toHeight === null) {
            toHeight = Math.floor(fileInfo.height / fileInfo.width * toWidth);
        }

        var size = toWidth + 'x' + toHeight;
        var rasterSize = toWidth * toHeight;
        var originalSize = fileInfo.width * fileInfo.height;
        var density = calculateRasterDensity(rasterSize, originalSize, fileInfo.density);

        toName = toName || fileInfo.filename.replace(/\.[^/.]+$/, "") + '-' + size + '.png';

        var command = 'convert -background none -density ' + density
            + ' -resize ' + size + ' '
            + filename + ' ' + toName;

        console.info('converting %s to %s with size: %s'.info, filename, toName, size);
        common.execute(command, common.dryRun, callback);
    });
}

function getFileInfo(filename, callback) {

    var command = 'convert ' + filename + ' -format "%f %m %w %h %x %y\\n" info:'
    common.execute(command, function(error, output) {
        if (error) {
            callback(error);
        }

        var splitOutput = output.split(' ');

        var xResolution = splitOutput[4];
        var yResolution = splitOutput[5];
        var density = xResolution === yResolution ? xResolution : Math.max(xResolution, yResolution);
        var fileInfo = {
            filename: splitOutput[0],
            filetype: splitOutput[1],
            width: parseInt(splitOutput[2]),
            height: parseInt(splitOutput[3]),
            density: parseInt(density)
        };

        //console.debug('getFileInfo: '.debug + JSON.stringify(fileInfo, null, 2));
        callback(null, fileInfo);
    });
}

function calculateRasterDensity(rasterSize, originalSize, originalDensity) {

    originalDensity = originalDensity || 72;

    var calculatedDensity = Math.ceil(rasterSize / originalSize * originalDensity);

    if (calculatedDensity < 300) {
        calculatedDensity = 300;
    }

    var sizeInfo = {
        originalSize: originalSize,
        originalDensity: originalDensity,
        rasterSize:rasterSize,
        calculatedDensity: Math.floor(calculatedDensity * 1.1)
    };

    //console.debug('calculateRasterDensity: '.debug + JSON.stringify(sizeInfo,null,2));

    return sizeInfo.calculatedDensity;
}
