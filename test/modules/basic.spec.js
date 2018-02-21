const { describe } = require('ava-spec');
const Async = require('async');
const Path = require('path');
const _ = require('lodash');
const moment = require('moment');
const { roundSize } = require('../testUtil');
const basic = require('../../src/modules/basic');
const fs = require('fs');

const projectPath = Path.join(__dirname, '..','fixtures', '1_js_project');

describe('Analyze', (test) => {
    let project;
    test.before.cb((t) => {
        basic.analyze(projectPath, (err,res) => {
            project = res;
            t.end(err);
        })
    })

    test('reads created & updated date', (t) => {
            t.truthy(project.updated_at);
            t.truthy(project.created_at);
    });

    test('reads created & updated date', (t) => {
        const expectedSize = 45789;
        // 33 without .DS_STORE
        t.is(roundSize(project.project_size), 3);
    });
    
});

describe('Propose', (test) => {
    const project = {
        project_size: 123456,
    }

    test('offers DeleteAction', (t) => {
        const proposal = basic.propose(project);
        const deleteProposal = _.find(proposal, {key: 'delete_project'});
        t.truthy(deleteProposal);
        t.is(deleteProposal.potential, project.project_size);
    });

    test('offers ArchiveAction', (t) => {
        const proposal = basic.propose(project);
        const archiveProposal = _.find(proposal, {key: 'archive_project'});
        t.truthy(archiveProposal);
        const expectedSavings = Math.round(project.project_size * 0.65);
        t.is(archiveProposal.potential, expectedSavings);
    });
});

describe('DeleteAction', (it) => {
    const project = {
        project_size: 123456,
    }

    it('is not recommended', (t) => {
        const proposal = new basic.DeleteProjectProposal(project);
        t.false(proposal.isRecommended());
    });

    it.cb('can delete folder', (t) => {
        const fakeProjectPath = Path.join(__dirname, '../', 'fixtures', '3_to_delete');
        const fakeProject = {
            path: fakeProjectPath,
            name: '3_to_delete',
            project_size: 100
        }
        const proposal = new basic.DeleteProjectProposal(fakeProject);
        t.plan(2);
        Async.series([
            (cb) => {
                if (!fs.existsSync(fakeProjectPath)){
                    return fs.mkdir(fakeProjectPath, cb);
                }
                cb();
            },
            (cb) => {
                proposal.execute(cb);
            },
            (cb) => {
                fs.stat(fakeProjectPath, (err) => {
                    t.truthy(err);
                    t.is(err.code, 'ENOENT');
                    cb();
                })
            }
        ], t.end)
    })
});

describe('ArchiveAction', (it) => {

    it('is not recommended for projects younger than one year', (t) => {
        const tooYoung = {
            project_size: 123456,
            updated_at: moment().subtract(11, 'months')
        }
        const proposal = new basic.ArchiveProjectProposal(tooYoung);
        t.false(proposal.isRecommended());
    });
     
    it('is recommended for projects older than one year', (t) => {
        const oldEnough = {
            project_size: 123456,
            updated_at: moment().subtract(13, 'months')
        }
        const proposal = new basic.ArchiveProjectProposal(oldEnough);
        t.true(proposal.isRecommended());
    });

    it.cb('can archive', (t) => {
        const fakeProjectPath = Path.join(__dirname, '../', 'fixtures', '1_js_project');
        const fakeProject = {
            path: fakeProjectPath,
            name: '1_js_project',
            project_size: 100
        }
        const proposal = new basic.ArchiveProjectProposal(fakeProject);
        const archivePath = Path.join(__dirname, '../', '_archive', '1_js_project.zip')
        Async.waterfall([
            // Delete existing archive
            (cb) => {
                if (fs.existsSync(archivePath)){
                    return fs.unlink(archivePath, cb);
                }
                cb();
            },
            (cb) => {
                proposal.execute(cb);
            },
            (zipPath,cb) => {
                // check if zip exists
                fs.stat(zipPath, cb)
            },
        ], t.end)
    })

});

