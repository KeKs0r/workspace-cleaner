const fs = require('fs');
const jsonfile = require('jsonfile');
const _ = require('lodash');
var jsonParser = require('moment-json-parser');
const Path = require('path');
const cachePath = Path.join(__dirname, '../','../', '_cache.json');


function _clean(data){
    const cleaned = _.map(data, (d) => {
        const cleanProject = _.omit(d, 'proposals', 'recommendation');
        return cleanProject;
    })
    return cleaned;
}

function _cache(data, cb) {
    // Remove Circular Dependency
    const cleaned = _clean(data);
    jsonfile.writeFile(cachePath, cleaned, (err) => {
        if (err) {
            console.error(err);
        }
        cb && cb(null, data);
    })
}

// function _regenerate(cb){
//     try {
//         const cache = fs.readFileSync(cachePath);
//         console.log('cache first signs:')
//         console.log(cache[0]);
//         console.log(cache[1]);
//         console.log(cache[2]);
//         const parsed = jsonParser(cache);
//         const proposed = _.map(parsed, (p) => {
//             return proposeProject(p);
//         });
//         cb(null, proposed)
//         return true
//     } catch (e) {
//         console.error(e);
//         console.log('Cache not found:'+cachePath);
//         return false;
//     }
// }


class CachedProcessor {
    constructor(processor){
        this.processor =  processor;
    }
    list(path, cb){
        if(this._regenerate(cb)){
            return
        }
        this.processor.list(path, (err,res) => {
            if(!err){
               return _cache(res, cb);
            }
            cb(err, res);
        })
    }
    // analyzeProject(path, cb) {
    //     this.processor.analyzeProject(path, cb);
    // }
    _regenerate(cb){
        const processor = this.processor;
            try {
        const cache = fs.readFileSync(cachePath);
        const parsed = jsonParser(cache);
        const proposed = _.map(parsed, (p) => {
            return processor.proposeProject(p);
        });
        cb(null, proposed)
        return true
    } catch (e) {
        if(e.code !== 'ENOENT'){
            console.error(e);
        }
        return false;
    }
    }
}

module.exports = {CachedProcessor, _clean}