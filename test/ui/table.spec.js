const { describe } = require('ava-spec');
const expect = require('unexpected');
const Path = require('path');
const Table = require('terminal-table');
const table = require('../../src/ui/table');
const _ = require('lodash');
const moment = require('moment');
const {DeleteProjectProposal, ArchiveProjectProposal} = require('../../src/modules/basic');

const firstData = {
    name: 'fixture', project_size: 23456, modules_size: 12345, updated_at: moment(), created_at: moment()
}
const allProposals = [
    new DeleteProjectProposal(firstData),
    new ArchiveProjectProposal(firstData)
];
const fixture = [
    Object.assign({}, firstData, {
        proposals: [
           new ArchiveProjectProposal(firstData)
        ]
    }),
    Object.assign({}, firstData, {
        proposals: [
            new DeleteProjectProposal(firstData),
            new ArchiveProjectProposal(firstData)
        ]
    }),
]

describe('Utility - ', (test) => {

    test('get Unique Proposals', (t) => {
        const proposals = table._getProposalTypes(fixture);
        expect(proposals, 'to have keys', ['archive_project', 'delete_project']);
        const labels = _.map(proposals, 'label');
        expect(labels, 'to contain', 'Del P', 'Zip P');
    });
    
});


describe('Header', (test) => {

    const mockTable = new Table();
    table._createHeader(fixture, mockTable)
    const tableData = mockTable.table; 
    const titles = _.map(tableData[0], 'text');

    test('contains static elements ', (t) => {
        expect(titles, 'to contain', 
        'Name', 'Size', 'Module Size', 'Module Size', 'Last Used', 'Created'
        );
    });

    test('contains proposal flags', (t) => {
        expect(titles, 'to contain', 
        'Del P', 'Zip P',
        );
    });

    test.todo('contains proposal flag labels');

    test('contains proposal recommendation', (t) => {
        expect(titles, 'to contain', 
        'Recommendation', 'Potential', 'Rest'
        );
    }); 
});

describe('Group Header', (test) => {

    const mockTable = new Table();
    table._createGroupHeader(fixture,'total', mockTable)
    const tableData = mockTable.table; 
    const header = _.map(tableData[0], 'text');

    test('contains Group Name ', (t) => {
        t.is(header[0], 'Total');
    });

    test('contains Aggregate Sizes', (t) => {
        t.is(header[1], '46 KB');
        t.is(header[2], '24 KB');
    });

    test.todo('contains proposal flag labels');
    
});

describe('Row', (test) => {

    const mockTable = new Table();
    const row = table._formatRow(fixture[0], allProposals);
    fixture[0] /*? $.size */
    console.log(row);
    test('contains Name & Size ', (t) => {
        t.is(row[0], firstData.name);
        t.is(row[1], '23 KB');
        t.is(row[2], '12 KB');
    });

    test('contains Date Fields', (t) => {
        t.true(row[3].indexOf('-') > -1);
        t.true(row[4].indexOf('-') > -1);
    });

    test.todo('contains proposal flags');

    test.todo('contains recommendation');
    
});


describe('Table', (test) => {

    const mockTable = table.makeTable(fixture)
    const tableData = mockTable.table; 
    //const titles = _.map(tableData[0], 'text');

    test('can be created', (t) => {
    });
});