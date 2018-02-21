const { describe } = require('ava-spec');
const expect = require('unexpected');
const Path = require('path');
const Async = require('async');
const { roundSize, ensureFolderExists } = require('../testUtil');
const node_modules = require('../../src/modules/node_modules');
const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');


function _ensure(path){
    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
}

describe('NPM Project', (test) => {
    const projectPath = Path.join(__dirname, '..', 'fixtures', '1_js_project');
    test.cb('analyzes module size', (t) => {
        // 32 only without all .DS_STORE files
        node_modules.analyze(projectPath, (err, res) => {
            t.is(roundSize(res.modules_size), 3);
            t.end(err);
        })
    });

    // Proposal
    const project = {
        project_size: 2000,
        modules_size: 1000
    }

    test('offers Optimize Modules', (t) => {
        const proposals = node_modules.propose(project);
        const proposal = _.find(proposals, {key: 'optimize_modules'});
        t.truthy(proposal);
    });

    test('offers Delete Modules', (t) => {
        const proposals = node_modules.propose(project);
        const proposal = _.find(proposals, {key: 'delete_modules'});
        t.truthy(proposal);
        const expectedSavings = project.modules_size;
        t.is(proposal.potential, expectedSavings);
    });

    test('offers delete & archive', (t) => {
        const proposals = node_modules.propose(project);
        const proposal = _.find(proposals, {key: 'archive_project_without_modules'});
        t.truthy(proposal);
        const expectedSavings = 1650;
        t.is(proposal.potential, expectedSavings);
    });
});

describe('Non Javascript Project', (test) => {
    const projectPath = Path.join(__dirname, '..', 'fixtures', '1_non_module');
    test.cb('has 0 as module size', (t) => {
        node_modules.analyze(projectPath, (err, res) => {
            t.is(res.modules_size, 0);
            t.end(err);
        })
    });

    const project = {
        module_size: 0
    }

    test('has no module proposals', (test) => {
        const proposals = node_modules.propose(project);
        test.is(proposals.length, 0);
    })
});

describe('OptimizeAction', (it) => {

    it('is recommended for project older than 2 weeks', (t) => {
        const project = {
            project_size: 1000,
            modules_size: 500,
            updated_at: moment().subtract(3, 'weeks')
        }
        const expectedSavings = project.modules_size * 0.15;
        const proposal = new node_modules.OptimizeModulesProposal(project);   
        t.is(proposal.potential, expectedSavings);
        t.true(proposal.isRecommended());
    });

    it('is not recommended for project younger than 2', (t) => {
        const project = {
            project_size: 1000,
            modules_size: 500,
            updated_at: moment().subtract(10, 'days')
        }
        const proposal = new node_modules.OptimizeModulesProposal(project);   
        t.false(proposal.isRecommended());
    });

    it.cb('cleanes out unnecessary files', (t) => {
        const path = Path.join(__dirname, '../', 'fixtures', '1_js_project');
        const project = {
            path,
            project_size: 1000,
            modules_size: 500,
            updated_at: moment().subtract(1, 'months')
        }
        t.plan(1);
        const proposal = new node_modules.OptimizeModulesProposal(project);   
        proposal.simulate((err, res) => {
            t.falsy(err);
            expect(res, 'to contain', 'minimist/readme.markdown');
            t.end();
        })
    })
})

describe('DeleteModules', (it) => {

    it('is recommended for project older than 2 months', (t) => {
        const project = {
            project_size: 1000,
            modules_size: 500,
            updated_at: moment().subtract(3, 'months')
        }
        const proposal = new node_modules.DeleteModulesProposal(project);   
        t.is(proposal.potential, project.modules_size);
        t.true(proposal.isRecommended());
    });

    it('is not recommended for project younger than 2 months', (t) => {
        const project = {
            project_size: 1000,
            modules_size: 500,
            updated_at: moment().subtract(25, 'days')
        }
        const proposal = new node_modules.DeleteModulesProposal(project);   
        t.false(proposal.isRecommended());
    });

    it.cb('deletes node_modules', (t) => {
        const path = Path.join(__dirname, '../', 'fixtures', '4_js_project_modules');
        const modules_path = Path.join(path, 'node_modules');
        const project = {
            path,
            project_size: 1000,
            modules_size: 500,
            updated_at: moment().subtract(3, 'months')
        }
        const proposal = new node_modules.DeleteModulesProposal(project);
        t.plan(2);
        Async.series([
            (cb) => {
                ensureFolderExists(path);
                ensureFolderExists(modules_path, cb);
            },
            (cb) => {
                proposal.execute(cb);
            },
            (cb) => {
                fs.stat(modules_path, (err) => {
                    t.truthy(err);
                    t.is(err.code, 'ENOENT');
                    cb();
                })
            }
        ], t.end)
    })
})

describe('DeleteModules and Archive Project', (it) => {

    it('is recommended for if has modules & is older than 12 month', (t) => {
        const project = {
            project_size: 1000,
            modules_size: 500,
            updated_at: moment().subtract(13, 'months')
        }
        const proposal = new node_modules.DeleteModulesAndArchiveProposal(project); 
        t.truthy(proposal);
        const expectedPotential = (1000 - 500) + (1000-500) * 0.65; 
        t.is(proposal.potential, expectedPotential);
        t.true(proposal.isRecommended());
    });


    it('is not recommended for project younger than 12 months', (t) => {
        const project = {
            project_size: 1000,
            modules_size: 500,
            updated_at: moment().subtract(10, 'months')
        }
        const proposal = new node_modules.DeleteModulesAndArchiveProposal(project);   
        t.false(proposal.isRecommended());
    });

    it.todo('delete & archives');
})
