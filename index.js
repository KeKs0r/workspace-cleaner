const Path = require('path');
const Processor = require('./src/processor');
const { CachedProcessor } = require('./src/cache');
const table = require('./src/ui/table');

const processor = new CachedProcessor(Processor);
path = Path.join(__dirname, '../');



processor.list(path, (err, res) => {
    if(err){
        console.error(err);
        process.exit(-1);
    }
    
    const output = table.makeTable(res);
    console.log(''+output);
    
    //process.exit(0);
})
