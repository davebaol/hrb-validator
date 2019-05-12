const isPlainObject = require('is-plain-object');
const isRegExp = require('is-regexp');

const primitiveTypeCheckers = {
  boolean: arg => typeof arg === 'boolean',
  null: arg => arg == null, // null or undefined
  number: arg => typeof arg === 'number',
  string: arg => typeof arg === 'string'
};

const typeCheckers = Object.assign(primitiveTypeCheckers, {
  array: arg => Array.isArray(arg),
  object: arg => isPlainObject(arg),
  regex: arg => isRegExp(arg)
});

const typeCheckerKeys = Object.keys(typeCheckers);
function getType(value) {
  return typeCheckerKeys.find(k => typeCheckers[k](value));
}

module.exports = {
  primitiveTypeCheckers,
  typeCheckers,
  getType
};
