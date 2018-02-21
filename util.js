const moment = require('moment');
const {hasUnmerged, canMerge} = require('./git');



function evaluate(folder){
    const {project, modules} = folder;
    const size = (folder.size) ? folder.size : 0; 
    const module_size = (folder.modules_size) ? folder.modules_size : 0; 
    const cleaned = {
        name: folder.name,
        size: size,
        module_size: module_size,
        updated_at: moment(project.mtime),
        created_at: moment(project.birthtime),
    }
    const optimizations = Object.assign({}, cleaned, {
        can_optimize: canOptimize(cleaned),
        can_delete_m: canDeleteModules(cleaned),
        can_zip: canZip(cleaned),
        can_delete_p: canDelete(cleaned)
    });
    const git = {
        hasUnmerged: hasUnmerged(folder.git),
        canMerge: canMerge(folder.git),
    }
    const potential = {
        potential: savingPotential(optimizations)
    }
    return Object.assign({}, optimizations, potential, git, {
        rest: cleaned.size - potential.potential 
    });
}

/** Conditions **/
function canOptimize(data){
    const days_old = moment().diff(data.updated_at, 'days');
    return data.module_size > 0 && days_old > 14;
}

function canDeleteModules(data){
    const months_old = moment().diff(data.updated_at, 'month');
    return data.module_size > 0 && months_old > 2;
}

function canZip(data){
    const months_old = moment().diff(data.updated_at, 'month');
    return months_old > 12;
}

function canDelete(data){
    return false;
}




/** Potential Calculation **/
const compressionRatio = 0.35;
const savingRatio = 1 - compressionRatio;
const optimizeRatio = 0.15;
function savingPotential(data){
    if(data.can_delete_p){
        return data.size;
    }
    if(data.can_zip){
        return data.module_size + ( (data.size - data.module_size) * savingRatio );
    }
    if(data.can_delete_m){
        return data.module_size;
    }
    if(data.can_optimize){
        return data.module_size * optimizeRatio;
    }
    return 0;
}

module.exports = {
    evaluate: evaluate,
    canOptimize,
    canDeleteModules,
    canZip,
    canDelete
}