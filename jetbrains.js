#!/usr/bin/env node
'use strict';

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
    var projectFilePatterns = [/pom\.xml/, /\.ipr/, /build\.xml/];

    fs.readdir(directory, function(err, items) {
        var hasWebstormFiles = _.size(_.intersection(items, webStormFiles)) > 0;
        var hasPhpStormFiles = _.size(_.intersection(items, phpStormFiles)) > 0;

        var project = _.find(items, function(item) {
            var hasProjectFile = false;
            _.each(projectFilePatterns, function(pattern) {
                hasProjectFile = hasProjectFile || pattern.test(item);
            });
            return hasProjectFile;
        });

        var appName = '';
        if (hasPhpStormFiles) {
            appName = 'PhpStorm';
        } else if (hasWebstormFiles) {
            appName = 'WebStorm';
        } else {
            appName = 'IntelliJ';
        }

        getJetBrainsApp(appName, project, openByApplication);
    });
}

function openByApplication(error, application, project) {

    if (error) {
        console.error(error.stderr.error);
        process.exit(error.code);
    }

    var filename = null;
    if (application === '.idea') {
        filename = directory;
    } else {
        filename = project || directory;
    }

    common.execute('open -a "' + application + '" "' + filename + '"', common.dryRun, function(error, stdout) {
        if (error) {
            console.error(error.stderr.error);
            process.exit(error.code);
        }
        console.log(stdout.info);
    });
}

function getJetBrainsApp(appName, project, callback) {
    console.log('opening with %s'.info, appName);
    common.execute('ls -1d /Applications/' + appName + '* | tail -n1', function(error, application) {
        if (error) callback(error);

        application = application.replace(/\s+$/g, '');
        callback(null, application, project);
    });
}
