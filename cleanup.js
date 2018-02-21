const Path = require('path');
const _ = require('lodash');
const modclean = require('modclean');
const Async = require('async');
const fs = require('fs');
const rmdir = require('rmdir');
const zipFolder = require('zip-folder');

const {    canOptimize,
    canDeleteModules,
    canZip,
    canDelete, evaluate} = require('./util');

const basePath = Path.join(__dirname, '/../');
const archivePart = '_archive';
const test = false;


function deleteProject(projectPath, cb){
    if(test){
        console.log('Deleting ' + projectPath);
        return cb();
    }
    rmdir(projectPath, (err, dirs, files) => {
        cb(err);
    });
}

function optimizeProject(projectPath, cb){
    if(test){
        console.log('Optimizing '+ projectPath);
    }
    modclean({
        cwd: projectPath,
        test: test
    }, cb);
}

function deleteModules(projectPath, cb){
    const modulePath = Path.join(projectPath, 'node_modules');
    if(test){
        console.log('Deleting'+ modulePath);
        return cb();
    }
    rmdir(modulePath, function(err, dirs, files){
        if(err){
            return cb(err);
        }
        cb(null,{
            files: _.size(files),
            dirs: _.size(dirs)
        });
    })
}

function archiveProject(projectPath, cb){
    const relativeBase = Path.join(projectPath, '../');
    const pathParsed = Path.parse(projectPath);
    const projectName = pathParsed.base;
    const zipTarget = Path.join(relativeBase, archivePart, projectName + '.zip');
    if(test){
        console.log(`Zipping ${projectPath} into ${zipTarget}`);
        return cb();
    }
    zipFolder(projectPath, zipTarget, cb);
}


function optimize(project, cb){
    const projectPath = Path.join(basePath, project.name);
    if(test){
        console.log('TEST Mode activated');
    }
    if(canDelete(project)){
        return cb();
        deleteProject(projectPath, cb);
    } else if(canZip(project)){
        Async.series([
            (cb) => {
                if(canDelete(project)){
                    return deleteModules(projectPath, (err, res) => {
                        if(err && err.code !== 'ENOENT'){
                            return cb(err);
                        }
                        cb(null, res);
                    })
                }
                cb();
            },
            (cb) => {
                archiveProject(projectPath, cb)
            },
            (cb) => {
                deleteProject(projectPath, cb);
            }
        ], cb);
    } else if(canDeleteModules(project)){
        deleteModules(projectPath, cb)
    } else if(canOptimize(project)){
        optimizeProject(projectPath, cb);
    } else {
        cb();
    }
}

/* Quokka */
const projects = _.map(require('./cache.json'), evaluate);

const example = _.find(projects, {name: 'draft'});


optimize(example, (err,res) => {
    if(err){
        console.log('-------- ERROR ------');
        console.error(err);
    } else {
    console.log('----- SUCCESSS ------');
    console.log(res);
    }
});
