const round10 = require('round10').round10
function prettyBoolean(val){
    return val ? "✓" : '';
}

function prettyDate(date){
    if(!date){
        return '';
    }
    return date.format('YY-MM-DD');
}

function prettySize(bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (!bytes || bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   if(i < 3){
       return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
   }
   return round10(bytes / Math.pow(1024, i), -2) + ' ' + sizes[i];
};



module.exports = {
    prettyBoolean,
    prettyDate,
    prettySize,
    round10,
}