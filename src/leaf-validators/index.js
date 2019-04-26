const isPlainObject = require('is-plain-object');
const lengthOf = require('@davebaol/length-of');
const bridge = require('./bridge');
const { get, ensureArrayPath } = require('../util/path');
const { ensureOptions } = require('../util/misc');
const createShortcuts = require('../util/create-shortcuts');

const primitiveTypeCheckers = {
  boolean: arg => typeof arg === 'boolean',
  null: arg => arg == null, // null or undefined
  number: arg => typeof arg === 'number',
  string: arg => typeof arg === 'string'
};

const typeCheckers = Object.assign(primitiveTypeCheckers, {
  array: arg => Array.isArray(arg),
  object: arg => isPlainObject(arg),
  regex: arg => arg instanceof RegExp
});

const typeCheckerKeys = Object.keys(typeCheckers);
function getType(value) {
  return typeCheckerKeys.find(k => typeCheckers[k](value));
}

//
// LEAF VALIDATORS
// They all take path as the first argument
//
const leafValidators = {
  equals(path, value) {
    const p = ensureArrayPath(path);
    return obj => (get(obj, p) === value ? undefined : `equals: the value at path '${path}' must be equal to ${value}`);
  },
  isLength(path, options) {
    const p = ensureArrayPath(path);
    const opts = ensureOptions(options, { min: 0, max: undefined });
    return (obj) => {
      const len = lengthOf(get(obj, p));
      if (len === undefined) {
        return `isLength: the value at path '${path}' must be a string, an array or an object`;
      }
      return len >= opts.min && (opts.max === undefined || len <= opts.max) ? undefined : `isLength: the value at path '${path}' must have a length between ${opts.min} and ${opts.max}`;
    };
  },
  isSet(path) {
    const p = ensureArrayPath(path);
    return obj => (get(obj, p) != null ? undefined : `isSet: the value at path '${path}' must be set`);
  },
  isNotEmpty(path) {
    const p = ensureArrayPath(path);
    return (obj) => {
      const value = get(obj, p);
      if (!value) return `the value at path '${path}' must be set`;
      if (typeof value === 'string' && value.trim().length === 0) return `the value at path '${path}' must have at least a not space char`;
      if (typeof value === 'number' && value === 0) return `the value at path '${path}' must not be zero`;
      return undefined;
    };
  },
  isType(path, type) {
    const p = ensureArrayPath(path);
    if (typeof type === 'string' && typeCheckers[type]) {
      return obj => (typeCheckers[type](get(obj, p)) ? undefined : `isType: the value at path '${path}' must be a '${type}'; found '${getType(get(obj, p)) || 'unknown'}' instead`);
    }
    if (Array.isArray(type) && type.every(t => typeof t === 'string' && typeCheckers[t])) {
      return (obj) => {
        const value = get(obj, p);
        return (type.some(t => typeCheckers[t](value)) ? undefined : `isType: the value at path '${path}' must have one of the specified types '${type.join(', ')}'; found '${getType(value) || 'unknown'}' instead`);
      };
    }
    throw new Error(`isType: the type must be a string or an array of strings amongst ${Object.keys(typeCheckers).join(', ')}`);
  },
  isOneOf(path, values) {
    const p = ensureArrayPath(path);
    if (!Array.isArray(values)) {
      throw new Error('isOneOf: argument \'values\' must be an array');
    }
    return obj => (values.includes(get(obj, p)) ? undefined : `isOneOf: the value at path '${path}' must be one of ${values}`);
  },
  isDate(path) {
    const p = ensureArrayPath(path);
    return obj => (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(get(obj, p)) ? undefined : `the value at path '${path}' must be a date in this format YYYY-MM-DD HH:MM:SS`);
  },
  isArrayOf(path, type) {
    const p = ensureArrayPath(path);
    if (typeof type === 'string' && typeCheckers[type]) {
      return (obj) => {
        const value = get(obj, p);
        if (!Array.isArray(value)) return `isArrayOf: the value at path '${path}' must be an array; found '${getType(value) || 'unknown'}' instead`;
        const flag = value.every(e => typeCheckers[type](e));
        return flag ? undefined : `isArrayOf: the value at path '${path}' must be a 'array of ${type}'; found '${getType(value) || 'unknown'}' instead`;
      };
    }
    if (Array.isArray(type) && type.every(t => typeof t === 'string' && typeCheckers[t])) {
      return (obj) => {
        const value = get(obj, p);
        if (!Array.isArray(value)) return `isArrayOf: the value at path '${path}' must be a 'array'; found '${getType(value)}' instead`;
        const flag = value.every(e => type.some(t => typeCheckers[t](e)));
        return flag ? undefined : `isArrayOf: the value at path '${path}' must be an array where each item has a type amongst ${Object.keys(type).join(', ')}'; found '${getType(value)}' instead`;
      };
    }
    throw new Error(`isArrayOf: the type must be a string or an array of strings amongst ${Object.keys(typeCheckers).join(', ')}`);
  },
};

// Augment leaf validators with the ones bridged from validator package
bridge(leafValidators);

// Augment all leaf validators with shortcut 'opt'
createShortcuts(leafValidators, leafValidators);

module.exports = leafValidators;
