const colors = require('colors');

var cbLog = {
    debug: msg => {
        console.log(colors.black(`[DEBUG] ${msg}`));
    },
    info: msg => {
        console.log(colors.green(`[INFO] ${msg}`));
    },
    error: msg => {
        console.log(colors.red(`[ERROR] ${msg}`));
    }
};

module.exports = cbLog;