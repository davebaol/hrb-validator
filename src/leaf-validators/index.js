const deepEqual = require('fast-deep-equal');
const lengthOf = require('@davebaol/length-of');
const bridge = require('./bridge');
const { get } = require('../util/path');
const { typeCheckers, getType } = require('../util/type');
const ensureArg = require('../util/ensure-arg');
const createShortcuts = require('../util/create-shortcuts');
const Info = require('../util/info');

const { REF } = ensureArg;

//
// LEAF VALIDATORS
// They all take path as the first argument and have no children
//

function equals(path, value, deep) {
  const infoArgs = equals.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  let v = infoArgs[1].ensure(value);
  let d = infoArgs[2].ensure(deep);
  return (obj, ctx) => {
    if (p === REF) {
      try { p = infoArgs[0].ensureRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (v === REF) {
      try { v = infoArgs[1].ensureRef(value, ctx, obj); } catch (e) { return e.message; }
    }
    if (d === REF) {
      try { d = infoArgs[2].ensureRef(deep, ctx, obj); } catch (e) { return e.message; }
    }
    const result = d ? deepEqual(get(obj, p), v) : get(obj, p) === v;
    return result ? undefined : `equals: the value at path '${path}' must be equal to ${v}`;
  };
}

function isLength(path, options) {
  const infoArgs = isLength.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  let opts = infoArgs[1].ensure(options);
  return (obj, ctx) => {
    if (p === REF) {
      try { p = infoArgs[0].ensureRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (opts === REF) {
      try { opts = infoArgs[1].ensureRef(options, ctx, obj); } catch (e) { return e.message; }
    }
    const min = opts.min || 0;
    const max = opts.max; // eslint-disable-line prefer-destructuring
    const len = lengthOf(get(obj, p));
    if (len === undefined) {
      return `isLength: the value at path '${path}' must be a string, an array or an object`;
    }
    return len >= min && (max === undefined || len <= max) ? undefined : `isLength: the value at path '${path}' must have a length between ${opts.min} and ${opts.max}`;
  };
}

function isSet(path) {
  const infoArgs = isSet.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  return (obj, ctx) => {
    if (p === REF) {
      try { p = infoArgs[0].ensureRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    return get(obj, p) != null ? undefined : `isSet: the value at path '${path}' must be set`;
  };
}

function isType(path, type) {
  const infoArgs = isType.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  let t = infoArgs[1].ensure(type);
  const isSingleType = t !== REF && typeof t === 'string' && typeCheckers[t];
  const isArrayOfTypes = t !== REF && !isSingleType && Array.isArray(t) && t.every(tt => typeof tt === 'string' && typeCheckers[tt]);
  if (t !== REF && !isSingleType && !isArrayOfTypes) {
    throw new Error(`isType: the type must be a string or an array of strings amongst ${Object.keys(typeCheckers).join(', ')}`);
  }
  return (obj, ctx) => {
    if (p === REF) {
      try { p = infoArgs[0].ensureRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (t === REF) {
      try { t = infoArgs[1].ensureRef(type, ctx, obj); } catch (e) { return e.message; }
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
}

function isOneOf(path, values) {
  const infoArgs = isOneOf.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  let a = infoArgs[1].ensure(values);
  return (obj, ctx) => {
    if (p === REF) {
      try { p = infoArgs[0].ensureRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (a === REF) {
      try { a = infoArgs[1].ensureRef(values, ctx, obj); } catch (e) { return e.message; }
    }
    return a.includes(get(obj, p)) ? undefined : `isOneOf: the value at path '${path}' must be one of ${a}`;
  };
}

function isArrayOf(path, type) {
  const infoArgs = isType.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  let t = infoArgs[1].ensure(type);
  const isSingleType = t !== REF && typeof t === 'string' && typeCheckers[t];
  const isArrayOfTypes = t !== REF && !isSingleType && Array.isArray(t) && t.every(tt => typeof tt === 'string' && typeCheckers[tt]);
  if (t !== REF && !isSingleType && !isArrayOfTypes) {
    throw new Error(`isArrayOf: the type must be a string or an array of strings amongst ${Object.keys(typeCheckers).join(', ')}`);
  }
  return (obj, ctx) => {
    if (p === REF) {
      try { p = infoArgs[0].ensureRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (t === REF) {
      try { t = infoArgs[1].ensureRef(type, ctx, obj); } catch (e) { return e.message; }
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
}

function leafValidators() {
  /* eslint-disable no-unused-vars */
  /* istanbul ignore next */
  const vInfo = [
    new Info(equals, 'path:path', 'value:any', 'deep:boolean?'),
    new Info(isArrayOf, 'path:path', 'type:type'),
    new Info(isLength, 'path:path', 'options:options?'),
    new Info(isOneOf, 'path:path', 'values:array'),
    new Info(isSet, 'path:path'),
    new Info(isType, 'path:path', 'type:type')
  ];
  /* eslint-enable no-unused-vars */

  const target = vInfo.reduce((acc, info) => {
    info.consolidate();
    const k = info.name;
    acc[k] = info.validator; // eslint-disable-line no-param-reassign
    return acc;
  }, {});

  // Augment leaf validators with the ones bridged from validator package
  bridge(target);

  // Augment all leaf validators with shortcut 'opt'
  createShortcuts(target, target);

  return target;
}

module.exports = leafValidators();
