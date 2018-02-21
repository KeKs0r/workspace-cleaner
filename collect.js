const fs = require('fs');
const Path = require('path');
const Async = require('async');
const _ = require('lodash');
const getSize = require('get-folder-size');
const jsonfile = require('jsonfile');
const analyzeGit = require('./git').analyzeProject;


const cachePath = Path.join(__dirname, 'cache.json');


function ignoreNotFound(cb){
    return (err,res) => {
            if (err && err.code !== 'ENOENT') {
                        return cb(err);
                        }
                        cb(null, res);
    }
}

function collect(path, cb) {
    try { 
        const cache = jsonfile.readFileSync(cachePath);
        return cb(null, cache)
    } catch(e){

    }
    const basePath = path;
    fs.readdir(path, (err, files) => {
        if (err) {
            return cb(err);
        }
        const withoutSystem = files
            .filter(filterSystem);
        Async.map(withoutSystem, (projectPath, cb) => {
            const fullPath = Path.join(basePath, projectPath)
            analyzeProject(fullPath, (err,res) => {
                if(err){
                    return cb(err);
                }
                cb(null, Object.assign({}, res,{
                    path: fullPath,
                    name: projectPath,
                }));
            });
        }, (err, res) => {
            const final = res;
            if(err){
               return cb(err);
            }
            jsonfile.writeFile(cachePath, final, (err) => {
                if(err){
                    return cb(err);
                }
                cb(null, final);
            })
        });
    })
}

function analyzeProject(fullPath, cb){
            const modulesPath = Path.join(fullPath, 'node_modules');
            Async.parallel([
                (cb) => {
                    // Get Project Stats
                    fs.stat(fullPath, cb);
                },
                (cb) => {
                    getSize(fullPath, cb);
                },
                (cb) => {
                    fs.stat(modulesPath, ignoreNotFound(cb));
                },
                (cb) => {
                    getSize(modulesPath, ignoreNotFound(cb));
                },
                (cb) => {
                    analyzeGit(fullPath, cb);
                }
            ], (err, res) => {
                if (err) {
                    return cb(err);
                }
                cb(null, {
                    project: res[0],
                    size: res[1],
                    modules: res[2],
                    modules_size: res[3],
                    git: res[4],
                });
            })
        }




module.exports = {
    collect,
    analyzeProject
};