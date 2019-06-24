/*
 CAUTION!!!
 The two lines below are apparently useless, but they're not.
 Because of the following circular dependency
   index.js --require--> branch-validators.js --require--> util/types.js --require--> index.js
 the line below
   module.exports.V = Object.assign({}, leafValidators, branchValidators);
 was creating an issue in util/types.js where the object exported from here
 appeared to be empty i.e. {}
 The solution is to set property V to an empty object before triggering the circular dependency
 and then add properties to it in place through Object.assign(), rather than re-assigning
 a new object to it.
*/
module.exports.V = {};
Object.assign(module.exports.V, require('./leaf-validators'), require('./branch-validators'));
module.exports.Scope = require('./util/scope');
module.exports.Context = require('./util/context');

const child = require('./util/types').getNativeType('child');

module.exports.compile = (v) => {
  const expr = child.compile(v);
  if (expr.resolved) { return expr.result; }
  throw new Error('Expected a validator; found a reference instead');
};
