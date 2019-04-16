const leafValidators = require('./leaf-validators');
const branchValidators = require('./branch-validators');

module.exports = Object.assign({}, leafValidators, branchValidators);
