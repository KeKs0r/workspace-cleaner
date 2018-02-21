const Path = require('path');
const Git = require('simple-git');
const Async = require('async');
const _ = require('lodash');

const githubAccess = /(keks0r|nearform)/

function analyzeProject(projectPath, cb) {
    try {
    const git = require('simple-git')(projectPath);
    Async.auto({
        remotes: (cb) => {
            git.getRemotes(true, cb);
        },
        hasOwnOrigin: ['remotes', (res, cb) => {
            const {remotes} = res;
            const origin =  _.find(remotes, {name: 'origin'});
            const pushUrl = _.get(origin, 'refs.push');
            const canPush = pushUrl && pushUrl.toLowerCase().match(githubAccess);
            cb(null, !!canPush);
        }],
        branches: (cb) => {
            git.branch(cb);
        },
        branchInfos: ['branches', (res, cb) => {
            const allBranches = _.get(res, 'branches.branches');
            cb(null, getBranchInfos(allBranches));
        }],
        diff: ['branchInfos', (res, cb) => {
            const branches = res.branchInfos;
            const unmerged = _.filter(branches, (b) => {
                return _.get(b,'commit') !== _.get(b, 'remote.commit');
            })
            cb(null, unmerged);
        }],
    }, (err,res) => {
        if(err){
            return cb(err);
        }
        const result = Object.assign({}, _.pick(res, 'diff', 'hasOwnOrigin', 'b' ), {git});
        cb(null, result);
    });
    } catch(e){
        console.log('BRUTALER ERROR in git init');
        console.log(e);
        return cb();
    }
}


function getBranchInfos(allBranches){
    const originBranches = _.chain(allBranches)
        .filter((b) => {
            return b.name.indexOf('origin') > -1
        })
        .map((b) => {
            const base_name = _.get(Path.parse(b.name), 'base');
            return Object.assign({}, b, {base_name});
        })
        .keyBy('base_name')
        .value()
    const localBranches = _.chain(allBranches)
        .filter((b) => { 
            return b.name.indexOf('/') === -1
        })
        .map((b) => {
            const remote = originBranches[b.name];
            return Object.assign({}, b, {remote});
        })
        .value()
    return localBranches;
}


function fix(projectPath, cb){
    analyzeProject(projectPath, (err,res) => {
        if(err){
            return cb(err);
        }
        fixProject(res, cb);
    })
}

function fixProject(project, cb){
    if(!project.hasOwnOrigin){
        return cb(new Error('Can only fix project with own origin'));
    }
    const { diff, git } = project;
    if(!git){
        return cb(new Error('Git Handle wasnt provided'));
    }
    Async.eachSeries(diff, (branch, cb) => {
        git.push('origin', branch.name, (err,res) => {
            if(err){
                console.error(err);
            }
            cb(null, res);
        })
    }, cb);
}

function hasUnmerged(folder){
    return _.size(diff) > 0
}

function canMerge(folder){
    return folder.hasOwnOrigin;
}


module.exports = {
    analyzeProject,
    fix,
    hasUnmerged,
    canMerge,
}