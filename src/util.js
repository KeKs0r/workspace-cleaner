const Path = require('path');
function getProjectName(path){
    const pathParsed = Path.parse(path);
    const projectName = pathParsed.base;
    return projectName;
}

module.exports = {
    getProjectName
}