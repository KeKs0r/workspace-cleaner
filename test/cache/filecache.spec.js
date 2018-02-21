const { describe } = require('ava-spec');
const expect = require('unexpected').clone();
expect.use(require('unexpected-moment'));
const Path = require('path');
const _ = require('lodash');

const { _clean, CachedProcessor } = require('../../src/cache/filecache');
const Processor = require('../../src/processor');
const processor = new CachedProcessor(Processor);

const moment = require('moment');
const { DeleteProjectProposal } = require('../../src/modules/basic');

const basePath = Path.join(__dirname, '..', 'fixtures');


describe('lists standard behaviour', (it) => {
    let projects;
    it.before.cb((t) => {
        processor.list(basePath, (err, res) => {
            t.falsy(err);
            projects = res;
            t.end();
        })
    })

    it('finds 1_js_project', (t) => {
        const project = projects[0];
        expect(project, 'to satisfy', {
            name: '1_js_project',
            project_size: expect.it('to be greater than', 10000)
                .and('to be less than', 100000),
            updated_at: expect.it('to be a moment'),
            created_at: expect.it('to be a moment')
        });
    });

    /*
    it('finds 2_non_module', (t) => {
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
    */

});




describe('Cache', (it) => {

    const firstProject = {
        name: '1_js_project',
        path: '/Users/marc/Sites/cleanup/test/fixtures/1_js_project',
        project_size: 33425,
        updated_at: moment(),
        created_at: moment(),
        modules_size: 32234,
    };

    const projects = [
        Object.assign({}, firstProject,
            {
                proposals: [
                    new DeleteProjectProposal(firstProject)
                ]
            },
            { recommendation: undefined }
        )

    ]

    it('cleans them correctly', (t) => {
        const cleaned = _clean(projects);
        const example = cleaned[0];
        t.falsy(example.proposals);
        t.falsy(example.recommendation);
    })
})

