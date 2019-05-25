const deepEqual = require('fast-deep-equal');
const lengthOf = require('@davebaol/length-of');
const bridge = require('./bridge');
const { get } = require('../util/path');
const createShortcuts = require('../util/create-shortcuts');
const Info = require('../util/info');
const Context = require('../util/context');
const { REF, getType } = require('../util/types');

//
// LEAF VALIDATORS
// They all take path as the first argument and have no children
//

function equals(path, value, deep) {
  const infoArgs = equals.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  let v = infoArgs[1].ensure(value);
  let d = infoArgs[2].ensure(deep);
  return (obj, ctx = new Context()) => {
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
  console.log('isLength ensure arg[1] =', opts, opts === REF);
  return (obj, ctx = new Context()) => {
    if (p === REF) {
      try { p = infoArgs[0].ensureRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (opts === REF) {
      console.log('isLength calling ensureRef arg[1] =', opts);
      try { opts = infoArgs[1].ensureRef(options, ctx, obj); } catch (e) { return e.message; }
      console.log('isLength ensureRef arg[1] =', opts);
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
  return (obj, ctx = new Context()) => {
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
  if (t !== REF) {
    t = getType(t);
  }
  return (obj, ctx = new Context()) => {
    if (p === REF) {
      try { p = infoArgs[0].ensureRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (t === REF) {
      try {
        t = infoArgs[1].ensureRef(type, ctx, obj);
        t = ctx.getType(t);
      } catch (e) { return e.message; }
    }
    return t.check(get(obj, p)) ? undefined : `isType: the value at path '${path}' must be a '${t.name}'`;
  };
}

function isOneOf(path, values) {
  const infoArgs = isOneOf.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  let a = infoArgs[1].ensure(values);
  return (obj, ctx = new Context()) => {
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
  if (t !== REF) {
    t = getType(t);
  }
  return (obj, ctx = new Context()) => {
    if (p === REF) {
      try { p = infoArgs[0].ensureRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (t === REF) {
      try {
        t = infoArgs[1].ensureRef(type, ctx, obj);
        t = ctx.getType(t);
      } catch (e) { return e.message; }
    }
    const value = get(obj, p);
    if (!Array.isArray(value)) return `isArrayOf: the value at path '${path}' must be an array`;
    const flag = value.every(e => t.check(e));
    return flag ? undefined : `isArrayOf: the value at path '${path}' must be an array of '${t.name}'`;
  };
}

function leafValidators() {
  /* eslint-disable no-unused-vars */
  /* istanbul ignore next */
  const vInfo = [
    new Info(equals, 'path:path', 'value:any', 'deep:boolean?'),
    new Info(isArrayOf, 'path:path', 'type:string|array'),
    new Info(isLength, 'path:path', 'options:options?'),
    new Info(isOneOf, 'path:path', 'values:array'),
    new Info(isSet, 'path:path'),
    new Info(isType, 'path:path', 'type:string|array')
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
