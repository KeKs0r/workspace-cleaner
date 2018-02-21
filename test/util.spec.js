const test = require('ava');
const expect = require('unexpected');
const Path = require('path');
const _ = require('lodash');
const { getProjectName } = require('../src/util');


const project =  '1_js_project';
const basePath = Path.join(__dirname ,'fixtures', project);



test('getProjectName from Path', (t) => {
    const name = getProjectName(basePath);
    t.is(name, project);
});
