const isPlainObject = require('is-plain-object');
const lengthOf = require('@davebaol/length-of');
const bridge = require('./bridge');
const { get } = require('../util/path');
const ensureArg = require('../util/ensure-arg');
const createShortcuts = require('../util/create-shortcuts');

const { REF } = ensureArg;

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
    let p = ensureArg.path(path);
    let v = ensureArg.any(value);
    return (obj) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
      }
      if (v === REF) {
        try { v = ensureArg.anyRef(obj, value); } catch (e) { return e.message; }
      }
      return get(obj, p) === v ? undefined : `equals: the value at path '${path}' must be equal to ${v}`;
    };
  },
  isLength(path, options) {
    let p = ensureArg.path(path);
    let opts = ensureArg.options(options);
    return (obj) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
      }
      if (opts === REF) {
        try { opts = ensureArg.optionsRef(obj, options); } catch (e) { return e.message; }
      }
      const min = opts.min || 0;
      const max = opts.max; // eslint-disable-line prefer-destructuring
      const len = lengthOf(get(obj, p));
      if (len === undefined) {
        return `isLength: the value at path '${path}' must be a string, an array or an object`;
      }
      return len >= min && (max === undefined || len <= max) ? undefined : `isLength: the value at path '${path}' must have a length between ${opts.min} and ${opts.max}`;
    };
  },
  isSet(path) {
    let p = ensureArg.path(path);
    return (obj) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
      }
      return get(obj, p) != null ? undefined : `isSet: the value at path '${path}' must be set`;
    };
  },
  isType(path, type) {
    let p = ensureArg.path(path);
    if (typeof type === 'string' && typeCheckers[type]) {
      return (obj) => {
        if (p === REF) {
          try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
        }
        return typeCheckers[type](get(obj, p)) ? undefined : `isType: the value at path '${path}' must be a '${type}'; found '${getType(get(obj, p)) || 'unknown'}' instead`;
      };
    }
    if (Array.isArray(type) && type.every(t => typeof t === 'string' && typeCheckers[t])) {
      return (obj) => {
        if (p === REF) {
          try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
        }
        const value = get(obj, p);
        return (type.some(t => typeCheckers[t](value)) ? undefined : `isType: the value at path '${path}' must have one of the specified types '${type.join(', ')}'; found '${getType(value) || 'unknown'}' instead`);
      };
    }
    throw new Error(`isType: the type must be a string or an array of strings amongst ${Object.keys(typeCheckers).join(', ')}`);
  },
  isOneOf(path, values) {
    let p = ensureArg.path(path);
    let a = ensureArg.array(values);
    return (obj) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
      }
      if (a === REF) {
        try { a = ensureArg.arrayRef(obj, values); } catch (e) { return e.message; }
      }
      return a.includes(get(obj, p)) ? undefined : `isOneOf: the value at path '${path}' must be one of ${a}`;
    };
  },
  isDate(path) {
    let p = ensureArg.path(path);
    return (obj) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
      }
      return (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(get(obj, p)) ? undefined : `the value at path '${path}' must be a date in this format YYYY-MM-DD HH:MM:SS`);
    };
  },
  isArrayOf(path, type) {
    let p = ensureArg.path(path);
    if (typeof type === 'string' && typeCheckers[type]) {
      return (obj) => {
        if (p === REF) {
          try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
        }
        const value = get(obj, p);
        if (!Array.isArray(value)) return `isArrayOf: the value at path '${path}' must be an array; found '${getType(value) || 'unknown'}' instead`;
        const flag = value.every(e => typeCheckers[type](e));
        return flag ? undefined : `isArrayOf: the value at path '${path}' must be a 'array of ${type}'; found '${getType(value) || 'unknown'}' instead`;
      };
    }
    if (Array.isArray(type) && type.every(t => typeof t === 'string' && typeCheckers[t])) {
      return (obj) => {
        if (p === REF) {
          try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
        }
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
