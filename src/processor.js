const Async = require('async');
const Path = require('path');
const fs = require('fs');
const _ = require('lodash');
const { getProjectName } = require('./util');
const basic = require('./modules/basic');
const node_modules = require('./modules/node_modules');


function filterSystem(d) {
    const folderStart = d[0];
    return folderStart !== '.' && folderStart !== '_';
}
function filterFiles(d) {
    return d.indexOf('.') === -1;
}


function _readDir(path, cb) {
    fs.readdir(path, (err, files) => {
        if (err) {
            return cb(err);
        }
        const withoutSystem = files
            .filter(filterSystem)
            .filter(filterFiles);
        cb(null, withoutSystem);
    });
}

function analyzeProject(path, cb) {
    const folderPath = path;
    Async.parallel([
        (cb) => {
            basic.analyze(folderPath, cb)
        },
        (cb) => {
            node_modules.analyze(folderPath, cb)
        }
    ], (err, res) => {
        const combined = Object.assign({},res[0], res[1]);
        const withProposal = proposeProject(combined);
        cb(null, withProposal);
    });
}

function proposeProject(p){
    const project = _.clone(p);
        project.proposals = []
            .concat(basic.propose(project))
            .concat(node_modules.propose(project));
        project.recommendation = recommend(project);
    return project;
}

function recommend(project) {
    const proposals = project.proposals;
    const best = _.chain(proposals)
        .filter((p) => p.isRecommended())
        .sortBy('potential')
        .last()
        .value();
    return best;
}


function list(path, cb) {

    const basePath = path;
    _readDir(basePath, (err, folders) => {
        if (err) return cb(err);
        Async.map(folders, (folder, next) => {
            const folderPath = Path.join(basePath, folder);
            analyzeProject(folderPath, next);
        }, (err, res) => {
            if (err) return cb(err);
            // Filter Single Error Folders
            cb(err, res);
        });
    })
}
module.exports = {
    list,
    analyzeProject,
    proposeProject,
    recommend,
    _readDir
}