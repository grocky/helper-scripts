#!/usr/bin/env node
"use strict";

var exec = require('child_process').exec;

var exports = module.exports = {};

exports.commander = require('commander');
exports.lodash = require('lodash');
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
exports.dryRun = process.env.DRY_RUN || false;

exports.objectCallback = function (error, object) {
    if (error) {
        console.log(error.stderr.error);
        process.exit(error.code);
    }
    console.log('objectCallback: '.debug + JSON.stringify(object, null, 2));
};

exports.execute = function(command, dryRun, callback) {

    var args = [].slice.call(arguments);
    command = args.shift();
    callback = args.pop();
    dryRun = args[0] || false;

    var prefix = 'execute: '.debug;
    if (dryRun) prefix = 'DRY_RUN '.warn + prefix;
    // console.log(prefix + command);

    if (!dryRun) {
        var options = { cwd: process.cwd() };
        exec(command, options, function(error, stdout, stderr) {
            if (error) {
                error.stdout = stdout;
                error.stderr = stderr;
                callback(error);
            }
            // console.log(stdout);
            callback(null, stdout);
        });
    }
};
