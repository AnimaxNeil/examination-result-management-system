// valid regex for the front end

const rgx = require(global.__basedir + "/custom-modules/regex");

let rgxub = Object.assign({}, rgx);
for (const key in rgxub) {
    rgxub[key] = rgxub[key].toString();
    rgxub[key] = rgxub[key].substring(2, rgxub[key].length - 2);
}

module.exports = rgxub;