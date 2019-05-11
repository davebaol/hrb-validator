const lengthOf = require('@davebaol/length-of');
const bridge = require('./bridge');
const { get } = require('../util/path');
const { typeCheckers, getType } = require('../util/type');
const ensureArg = require('../util/ensure-arg');
const createShortcuts = require('../util/create-shortcuts');

const { REF } = ensureArg;

//
// LEAF VALIDATORS
// They all take path as the first argument and have no children
//
const leafValidators = {
  equals(path, value) {
    let p = ensureArg.path(path);
    let v = ensureArg.any(value);
    return (obj, ctx) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
      }
      if (v === REF) {
        try { v = ensureArg.anyRef(value, ctx, obj); } catch (e) { return e.message; }
      }
      return get(obj, p) === v ? undefined : `equals: the value at path '${path}' must be equal to ${v}`;
    };
  },
  isLength(path, options) {
    let p = ensureArg.path(path);
    let opts = ensureArg.options(options);
    return (obj, ctx) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
      }
      if (opts === REF) {
        try { opts = ensureArg.optionsRef(options, ctx, obj); } catch (e) { return e.message; }
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
    return (obj, ctx) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
      }
      return get(obj, p) != null ? undefined : `isSet: the value at path '${path}' must be set`;
    };
  },
  isType(path, type) {
    let p = ensureArg.path(path);
    let t = ensureArg.type(type);
    const isSingleType = t !== REF && typeof t === 'string' && typeCheckers[t];
    const isArrayOfTypes = t !== REF && !isSingleType && Array.isArray(t) && t.every(tt => typeof tt === 'string' && typeCheckers[tt]);
    if (t !== REF && !isSingleType && !isArrayOfTypes) {
      throw new Error(`isType: the type must be a string or an array of strings amongst ${Object.keys(typeCheckers).join(', ')}`);
    }
    return (obj, ctx) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
      }
      if (t === REF) {
        try { t = ensureArg.typeRef(type, ctx, obj); } catch (e) { return e.message; }
      }
      if (isSingleType || (typeof t === 'string' && typeCheckers[t])) {
        return typeCheckers[t](get(obj, p)) ? undefined : `isType: the value at path '${path}' must be a '${t}'; found '${getType(get(obj, p)) || 'unknown'}' instead`;
      }
      if (isArrayOfTypes || (Array.isArray(t) && t.every(tt => typeof tt === 'string' && typeCheckers[tt]))) {
        const value = get(obj, p);
        return (t.some(tt => typeCheckers[tt](value)) ? undefined : `isType: the value at path '${path}' must have one of the specified types '${t.join(', ')}'; found '${getType(value) || 'unknown'}' instead`);
      }
      return `isType: the type must be a string or an array of strings amongst ${Object.keys(typeCheckers).join(', ')}`;
    };
  },
  isOneOf(path, values) {
    let p = ensureArg.path(path);
    let a = ensureArg.array(values);
    return (obj, ctx) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
      }
      if (a === REF) {
        try { a = ensureArg.arrayRef(values, ctx, obj); } catch (e) { return e.message; }
      }
      return a.includes(get(obj, p)) ? undefined : `isOneOf: the value at path '${path}' must be one of ${a}`;
    };
  },
  isDate(path) {
    let p = ensureArg.path(path);
    return (obj, ctx) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
      }
      return (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(get(obj, p)) ? undefined : `the value at path '${path}' must be a date in this format YYYY-MM-DD HH:MM:SS`);
    };
  },
  isArrayOf(path, type) {
    let p = ensureArg.path(path);
    let t = ensureArg.type(type);
    const isSingleType = t !== REF && typeof t === 'string' && typeCheckers[t];
    const isArrayOfTypes = t !== REF && !isSingleType && Array.isArray(t) && t.every(tt => typeof tt === 'string' && typeCheckers[tt]);
    if (t !== REF && !isSingleType && !isArrayOfTypes) {
      throw new Error(`isArrayOf: the type must be a string or an array of strings amongst ${Object.keys(typeCheckers).join(', ')}`);
    }
    return (obj, ctx) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
      }
      if (t === REF) {
        try { t = ensureArg.typeRef(type, ctx, obj); } catch (e) { return e.message; }
      }
      if (isSingleType || (typeof t === 'string' && typeCheckers[t])) {
        const value = get(obj, p);
        if (!Array.isArray(value)) return `isArrayOf: the value at path '${path}' must be an array; found '${getType(value) || 'unknown'}' instead`;
        const flag = value.every(e => typeCheckers[t](e));
        return flag ? undefined : `isArrayOf: the value at path '${path}' must be a 'array of ${type}'; found '${getType(value) || 'unknown'}' instead`;
      }
      if (isArrayOfTypes || (Array.isArray(t) && t.every(tt => typeof tt === 'string' && typeCheckers[tt]))) {
        const value = get(obj, p);
        if (!Array.isArray(value)) return `isArrayOf: the value at path '${path}' must be a 'array'; found '${getType(value)}' instead`;
        const flag = value.every(e => t.some(tt => typeCheckers[tt](e)));
        return flag ? undefined : `isArrayOf: the value at path '${path}' must be an array where each item has a type amongst ${Object.keys(t).join(', ')}'; found '${getType(value)}' instead`;
      }
      return `isArrayOf: the type must be a string or an array of strings amongst ${Object.keys(typeCheckers).join(', ')}`;
    };
  },
};

// Augment leaf validators with the ones bridged from validator package
bridge(leafValidators);

// Augment all leaf validators with shortcut 'opt'
createShortcuts(leafValidators, leafValidators);

module.exports = leafValidators;
