const fs = require('fs');

function ensureFolderExists(path, cb){
    if (!fs.existsSync(path)){
        if(cb){
            return fs.mkdir(path, cb);
        }
        fs.mkdirSync(path);
    }
    cb && cb();
}



module.exports = {
    roundSize: (number) => {
        return Math.round(number / 10000) 
    },
    ensureFolderExists
}