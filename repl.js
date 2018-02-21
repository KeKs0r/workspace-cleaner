const Path = require('path');
const Processor = require('./src/processor');
const cache = require('./src/cache');
const table = require('./src/ui/table');
const _ = require('lodash');

// const processor = cache(Processor);
// path = Path.join(__dirname, '../', 'prp-education');

// processor.analyzeProject(path, (err, res) => {
//     if(err){
//         console.error(err);
//     }
//     const props =  _.map(res.proposals, 'key'); /*?*/
// })

/*
const node_modules = require('./src/modules/node_modules');
const moment = require('moment');
const project = {
    project_size: 1000,
    modules_size: 500,
    updated_at: moment().subtract(13, 'months')
}
const proposal = new node_modules.DeleteModulesAndArchiveProposal(project); 

console.log(proposal.isRecommended());
*/



const { _clean} = require('./src/cache/filecache');
const moment = require('moment');
const { DeleteProjectProposal } = require('./src/modules/basic');

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
    const cleaned = _clean(projects);
