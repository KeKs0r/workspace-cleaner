const fs = require('fs');
const Path = require('path');
const Async = require('async');
const moment = require('moment');
const getSize = require('get-folder-size');
const rmdir = require('rmdir');
const zipFolder = require('zip-folder');
const { getProjectName } = require('../util.js')


/* Constants */
const archivePart = '_archive';


function _clean({stats, project_size, path}){
    return {
        name: getProjectName(path),
        path, 
        project_size,
        updated_at: moment(stats.mtime),
        created_at: moment(stats.birthtime),
    }
}

function analyze(projectPath, cb){
    Async.auto({
        stats: (cb) =>{
            fs.stat(projectPath, cb)
        },
        project_size: (cb) => {
            getSize(projectPath, cb)
        },
        path: (cb) => cb(null, projectPath)
    }, (err,res) => {
        if(err){
            return cb(err);
        }
        cb(null, _clean(res));
    })
}

function propose(project){
    return [
        new DeleteProjectProposal(project),
        new ArchiveProjectProposal(project)
    ]
}


// ** Proposals ** //
class DeleteProjectProposal {
    constructor(project){
        this.project = project;
        this.potential = project.project_size
    }
    isRecommended(){
        return false;
    }
    execute(cb){
        deleteProject(this.project.path, cb);
    }
    simulate(cb){
        deleteProject(this.project.path, cb, true);
    }
}
DeleteProjectProposal.prototype.key = 'delete_project';
DeleteProjectProposal.prototype.label = 'Del P';


const compressionRatio = 0.35

class ArchiveProjectProposal {
    constructor(project){
        this.project = project;
        this.potential = Math.round(project.project_size * (1-compressionRatio));
    }
    isRecommended(){
        const months_old = moment().diff(this.project.updated_at, 'month');
        return months_old > 12;
    }
    execute(cb){
        archiveProject(this.project.path, cb);
    }
    simulate(cb){
        archiveProject(this.project.path, cb, true);
    }
}
ArchiveProjectProposal.prototype.key = 'archive_project';
ArchiveProjectProposal.prototype.label = 'Zip P';


/** Action  **/

function deleteProject(projectPath, cb, test){
    if(test){
        console.log('Deleting ' + projectPath);
        return cb();
    }
    rmdir(projectPath, (err, dirs, files) => {
        cb(err);
    });
}

function archiveProject(projectPath, cb, test){
    const relativeBase = Path.join(projectPath, '../');
    const pathParsed = Path.parse(projectPath);
    const projectName = pathParsed.base;
    const archiveBase = Path.join(relativeBase, archivePart);
    if (!fs.existsSync(archiveBase)){
        fs.mkdirSync(archiveBase);
    }
    const zipTarget = Path.join(archiveBase, projectName + '.zip');
    if(test){
        console.log(`Zipping ${projectPath} into ${zipTarget}`);
        return cb();
    }
    zipFolder(projectPath, zipTarget, (err) => {
        if(err) return cb(err);
        cb(null, zipTarget);
    });
}

module.exports = {
    analyze,
    propose,
    ArchiveProjectProposal,
    DeleteProjectProposal,
    deleteProject,
    archiveProject,
    compressionRatio
}