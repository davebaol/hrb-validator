const leafValidators = require('./leaf-validators');
const branchValidators = require('./branch-validators');

// CAUTION!!!
// Because of the following circular dependency
//   index.js --|require|--> branch-validators.js --|require|--> util.js --|require|--> index.js
// the line below
//   module.exports = Object.assign({}, leafValidators, branchValidators);
// was creating an issue in util.js where the object exported from here appeared to be empty i.e. {}
// The solution is to add properties to it in place, rather than re-assigning a new object to it.
Object.assign(module.exports, leafValidators, branchValidators);
