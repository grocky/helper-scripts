#!/usr/bin/env node
"use strict";

var common = require('./common');
var _ = common.lodash;
var fs = require('fs');

var script = common.commander
    .version('0.0.1')
    .description('open a project using a JetBrains IDE')
    .arguments('[directory]')
    .parse(process.argv);

var directory = script.args[0];

if (typeof directory === 'undefined' || directory === '.') {
    directory = process.cwd();
}

openByDirectory(directory);

function openByDirectory(directory) {

    var webStormFiles = ['package.json', 'bower.json', 'gulpfile.json', 'gruntfile.json'];
    var phpStormFiles = ['composer.json'];
    var intelliJFiles= ['pom.xml'];

    fs.readdir(directory, function(err, items) {
        var hasWebstormFiles = _.size(_.intersection(items, webStormFiles)) > 0;
        var hasPhpStormFiles = _.size(_.intersection(items, phpStormFiles)) > 0;
        var hasIntelliJStormFiles = _.size(_.intersection(items, intelliJFiles)) > 0;

        if (hasPhpStormFiles) {
            getPhpStormApp(openByApplication);
        } else if (hasWebstormFiles) {
            getWebStormApp(openByApplication);
        } else {
            getIntelliJApp(openByApplication);
        }
    });

    // console.log('opening by file'.debug);
    //
    // var extension = directory.split('.').pop().toLowerCase();
    //
    // switch (extension) {
    //     case 'php':
    //         getPhpStormApp(openByApplication);
    //         break;
    //     case 'js':
    //     case 'css':
    //     case 'json':
    //         getWebStormApp(openByApplication);
    //         break;
    //     default:
    //         getIntelliJApp(openByApplication);
    // }
}

function openByApplication(error, application) {

    application = application.replace(/\s+$/g, '');

    common.execute('open -a "' + application + '" "' + directory + '"', common.dryRun, function(error, stdout) {
        if (error) {
            console.log(error.stderr.error);
            process.exit(error.code);
        }
        console.log(stdout.info);
    });
}

function getIntelliJApp(callback) {
    getJetBrainsApp('IntelliJ', callback);
}

function getPhpStormApp(callback) {
    getJetBrainsApp('PhpStorm', callback);
}

function getWebStormApp(callback) {
    getJetBrainsApp('WebStorm', callback);
}

function getJetBrainsApp(appName, callback) {
    console.log('opening with %s'.info, appName);
    common.execute('ls -1d /Applications/' + appName + '* | tail -n1', callback);
}
