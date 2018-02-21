const { describe } = require('ava-spec');
const expect = require('unexpected').clone();
expect.use(require('unexpected-moment'));
const Path = require('path');
const _ = require('lodash');
const { list, _readDir, analyzeProject, recommend } = require('../src/processor');
const basePath = Path.join(__dirname, 'fixtures');


describe('readDir', (it) => {
    it.cb('finds project folders', (t) => {
        _readDir(basePath, (err, folders) => {
            expect(folders, 'to contain',
                '1_js_project', '2_non_module', '4_js_project_modules'
            );
            expect(folders, 'to have length', 3);
            t.end(err);
        });
    });
})

describe('recommend', (it) => {
    const option1 = {
        key: '1',
        isRecommended: () => true,
        potential: 500
    };
    const option2 = {
        key: '2',
        isRecommended: () => false,
        potential: 1000
    };
    const option3 = {
        key: '3',
        isRecommended: () => true,
        potential: 700
    };
    it(' the best recommended option', (t) => {
        const best = recommend({proposals: [option1, option2, option3]});
        t.is(best.key, option3.key);
    })
});

describe('analyzeProject', (it) => {
    const jsProject = Path.join(basePath, '1_js_project');
    it.cb('merges different modules', t => {
        analyzeProject(jsProject, (err, project) => {
        expect(project, 'to satisfy', {
            name: '1_js_project',
            project_size: expect.it('to be greater than', 10000)
                .and('to be less than', 100000),
            updated_at: expect.it('to be a moment'),
            created_at: expect.it('to be a moment'),
            modules_size: expect.it('to be greater than', 10000)
                .and('to be less than', 100000)
        });
        t.end(err);
        })
    })
});


describe('lists', (it) => {
    let projects;
    it.before.cb((t) => {
        list(basePath, (err, res) => {
            t.falsy(err);
            projects = res;
            t.end();
        })
    })

    it('1_js_project', (t) => {
        const project = projects[0];
        expect(project, 'to satisfy', {
            name: '1_js_project',
            project_size: expect.it('to be greater than', 10000)
                .and('to be less than', 100000),
            updated_at: expect.it('to be a moment'),
            created_at: expect.it('to be a moment')
        });
    });

    it('2_non_module', (t) => {
        const project = projects[1];
        expect(project, 'to satisfy', {
            name: '2_non_module',
            project_size: expect.it('to be greater than', 0)
                .and('to be less than', 1000),
            modules_size: 0,
            updated_at: expect.it('to be a moment'),
            created_at: expect.it('to be a moment')
        });
    });
});
