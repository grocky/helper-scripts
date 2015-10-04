#!/usr/bin/env node

var program = require('commander');
var exec = require('child_process').exec;
var path = require('path');
var traceback = require('traceback');
var colors = require('colors');

program
    .version('0.0.1')
    .description('create a png from an svg using ImageMagick')
    .arguments('<svg-file>')
    .option('-W, --width <int>', 'The width to resize. If --height is not given, it will be calculated proportional the original size', parseInt)
    .option('-H, --height <int>', 'The height to resize. If --width is not given, it will be calculated proportional the original size', parseInt)
    .option('-F, --filename <filename>', 'The name of the resulting file. Defaults to <filename>-<W>x<H>.png')
    .parse(process.argv);

colors.setTheme({
    input: 'gray',
    verbose: 'cyan',
    prompt: 'gray',
    data: 'gray',
    help: 'cyan',
    info: 'green',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

var filename = program.args[0];
if (typeof filename === 'undefined') {
    console.log('    No svg-file given!'.error);
    process.exit(1);
}

var toWidth = program.width || null;
var toHeight = program.height || null;
var toName = program.filename || null;

convertSvgToPng(filename, toWidth, toHeight, toName, function (error, result) {
    if (error) {
        console.log(JSON.stringify(error, null, 2).error);
        process.exit(error.code);
    }
    console.log(result.info);
});

function convertSvgToPng(filename, toWidth, toHeight, toName, callback) {

    args = {
        filename: filename,
        toWidth: toWidth,
        toHeight: toHeight,
        toName: toName
    };
    console.log('convertSvgToPng: '.debug + JSON.stringify(args, null, 2));
    var args = [].slice.call(arguments);
    callback = callback || args.pop();

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

        execute(command, callback);
    });
}

function getFileInfo(filename, callback) {

    var command = 'convert ' + filename + ' -format "%f %m %w %h %x %y\\n" info:'
    execute(command, function(error, output) {
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

        console.log('getFileInfo: '.debug + JSON.stringify(fileInfo, null, 2));
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
        calculatedDensity: Math.floor(calculatedDensity * 1.2)
    };

    console.log('calculateRasterDensity: '.debug + JSON.stringify(sizeInfo,null,2));

    return sizeInfo.calculatedDensity;
}

function execute(command, callback) {
    var options = { cwd: process.cwd() };
    exec(command, options, function(error, stdout, stderr) {
        console.log('execute: '.debug + command);
        if (error) {
            error.stdout = stdout;
            error.stderr = stderr;
            callback(error);
        }
        callback(null, stdout);
    })
}

function objectCallback(error, object) {
    if (error) {
        console.log(error.stderr.error);
        process.exit(error.code);
    }
    console.log('objectCallback: '.debug + JSON.stringify(object, null, 2));
}
