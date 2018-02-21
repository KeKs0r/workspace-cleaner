const Table = require('terminal-table');
const _ = require('lodash');
const { prettySize, prettyDate, prettyBoolean, round10 } = require('./format');


const staticHeadline = [/*'group',*/ 'Name', 'Size', 'Module Size', 'Last Used', 'Created'];
const summaryFields = ['Recommendation', 'Potential', 'Rest']

function _getProposalTypes(data) {
    return _
        .chain(data)
        .flatMap('proposals')
        .keyBy('key')
        .value();
}

function _styleLastRow(t, style) {
    const currentRow = t.table.length;
    t.attrRange({ row: [currentRow-1, currentRow] }, style);
}

function _createHeader(data, t) {
    // t.attrRange({ column: [5, 8] }, {
    //     color: 'green',
    //     align: 'center',
    // })

    // Headline
    const allProposals = _getProposalTypes(data);
    const proposalLabel = [] // _.map(allProposals, 'label')
    const headline = [].concat(staticHeadline).concat(proposalLabel).concat(summaryFields);
    t.push(headline);
    t.attrRange({ row: [0, 1] }, {
        align: 'center',
        color: 'white',
        bg: 'black',
    })

    //Total Aggregate
    _createGroupHeader(data, {label:'Total'}, t);
    t.push(['']);

}

function _createGroupHeader(groupData, header, t) {
    const totalSize = _.sumBy(groupData, 'project_size');
    const moduleTotalSize = _.sumBy(groupData, 'modules_size');
    
    const potentialTotalSize = header.sum || _.sumBy(groupData, 'recommendation.potential');
    const restTotalSize = totalSize - potentialTotalSize;

    const proposalPart = [] // _.map(_getProposalTypes(groupData), () => '');
    const recommendationPart = ['',prettySize(potentialTotalSize), prettySize(restTotalSize)]

    const row = [
        header.label,
        prettySize(totalSize),
        prettySize(moduleTotalSize),
        '', '',
    ]
        .concat(proposalPart)
        .concat(recommendationPart);

    t.push(row);
    _styleLastRow(t, {
        color: 'red',
        bg: 'black',
    })
}

function makeTable(data) {

    const t = new Table({
        horizontalLine: true,
    });
    const proposalTypes = _getProposalTypes(data);

    _createHeader(data, t);

    /* Groups */
    const grouped = _.chain(data)
        .groupBy((d) => {
            const recommendation = _.get(d.recommendation,'key')
            return (recommendation) ? recommendation : 'none'
        })
        .map((g, key) => {
            const potential = _.sum(_.map(g, 'recommendation.potential'));
            return {
                key: key,
                data: g,
                sum: potential || 0
            }
        })
        .sortBy((g) => {
            return g.sum
        })
        .reverse()
        .value()

    _.forEach(grouped, (group) => {
        const { key } = group;
        const groupData = group.data;
        const label = (proposalTypes[key]) ? proposalTypes[key].label : 'Current'
        const header = {
            label: label,
            sum: group.sum
        }

        _createGroupHeader(groupData, header, t);

        _.chain(groupData)
            .sortBy('potential', 'size')
            .reverse()
            .value()
            .forEach((d, index) => {
                t.push(_formatRow(d, proposalTypes));
            })
        t.push(['']);
    })
    return t;
}

function _formatRow(data, proposalTypes) {
    const skipProposal = [] // _.map(_.values(proposalTypes), () => '');
    
    const recommendation = data.recommendation
    const recKey = (recommendation) ? recommendation.key : '';
    const potential = (recommendation) ? recommendation.potential : 0;
    const rest = data.project_size - potential;

    const result = {
        /*group: data.group.key,*/
        name: data.name,
        project_size: prettySize(data.project_size),
        modules_size: prettySize(data.modules_size),
        updated_at: prettyDate(data.updated_at),
        created_at: prettyDate(data.created_at),
        skipProposal,
        recommendation: recKey,
        potential: prettySize(potential),
        rest: prettySize(rest)
    }
    return _.flatten(_.values(result));
}










module.exports = {
    makeTable,
    _createHeader,
    _createGroupHeader,
    _formatRow,
    _getProposalTypes
}


/* Quokka */
/*
const { evaluate  } = require('./util');
const demoData = require('./cache.json')
const evaluated = demoData.map(evaluate);
const output = makeTable(evaluated);
console.log(""+output);
*/