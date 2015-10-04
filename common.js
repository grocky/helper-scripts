#!/usr/bin/env node

var exec = require('child_process').exec;

var exports = module.exports = {};

exports.script = require('commander');
exports.colors = require('colors');
exports.colors.setTheme({
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

exports.objectCallback = function (error, object) {
    if (error) {
        console.log(error.stderr.error);
        process.exit(error.code);
    }
    console.log('objectCallback: '.debug + JSON.stringify(object, null, 2));
};

exports.execute = function(command, callback) {

    console.log('execute: '.debug + command);

    var options = { cwd: process.cwd() };
    exec(command, options, function(error, stdout, stderr) {
        if (error) {
            error.stdout = stdout;
            error.stderr = stderr;
            callback(error);
        }
        callback(null, stdout);
    })
};
