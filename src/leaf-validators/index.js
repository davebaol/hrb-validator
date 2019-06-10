const deepEqual = require('fast-deep-equal');
const lengthOf = require('@davebaol/length-of');
const bridge = require('./bridge');
const { get } = require('../util/path');
const createShortcuts = require('../util/create-shortcuts');
const Info = require('../util/info');
const { getType } = require('../util/types');

//
// LEAF VALIDATORS
// They all take path as the first argument and have no children
//

function equals(path, value, deep) {
  const infoArgs = equals.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  const vExpr = infoArgs[1].compile(value);
  const dExpr = infoArgs[2].compile(deep);
  return (scope) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!vExpr.resolved) {
      infoArgs[1].resolve(vExpr, scope);
      if (vExpr.error) { return vExpr.error; }
    }
    if (!dExpr.resolved) {
      infoArgs[2].resolve(dExpr, scope);
      if (dExpr.error) { return dExpr.error; }
    }
    const result = dExpr.result
      ? deepEqual(get(scope.find('$'), pExpr.result), vExpr.result)
      : get(scope.find('$'), pExpr.result) === vExpr.result;
    return result ? undefined : `equals: the value at path '${path}' must be equal to ${vExpr.result}`;
  };
}

function isLength(path, options) {
  const infoArgs = isLength.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  const optsExpr = infoArgs[1].compile(options);
  return (scope) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!optsExpr.resolved) {
      infoArgs[1].resolve(optsExpr, scope);
      if (optsExpr.error) { return optsExpr.error; }
    }
    const opts = optsExpr.result;
    const min = opts.min || 0;
    const max = opts.max; // eslint-disable-line prefer-destructuring
    const len = lengthOf(get(scope.find('$'), pExpr.result));
    if (len === undefined) {
      return `isLength: the value at path '${path}' must be a string, an array or an object`;
    }
    return len >= min && (max === undefined || len <= max) ? undefined : `isLength: the value at path '${path}' must have a length between ${opts.min} and ${opts.max}`;
  };
}

function isSet(path) {
  const infoArgs = isSet.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  return (scope) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope);
      if (pExpr.error) { return pExpr.error; }
    }
    return get(scope.find('$'), pExpr.result) != null ? undefined : `isSet: the value at path '${path}' must be set`;
  };
}

function isType(path, type) {
  const infoArgs = isType.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  const tExpr = infoArgs[1].compile(type);
  if (tExpr.resolved) {
    tExpr.result = getType(tExpr.result);
  }
  return (scope) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!tExpr.resolved) {
      infoArgs[1].resolve(tExpr, scope);
      if (tExpr.error) { return tExpr.error; }
      try { tExpr.result = scope.context.getType(tExpr.result); } catch (e) { return e.message; }
    }
    const t = tExpr.result;
    return t.check(get(scope.find('$'), pExpr.result)) ? undefined : `isType: the value at path '${path}' must be a '${t.name}'`;
  };
}

function isOneOf(path, values) {
  const infoArgs = isOneOf.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  const aExpr = infoArgs[1].compile(values);
  return (scope) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!aExpr.resolved) {
      infoArgs[1].resolve(aExpr, scope);
      if (aExpr.error) { return aExpr.error; }
    }
    return aExpr.result.includes(get(scope.find('$'), pExpr.result)) ? undefined : `isOneOf: the value at path '${path}' must be one of ${aExpr.result}`;
  };
}

function isArrayOf(path, type) {
  const infoArgs = isType.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  const tExpr = infoArgs[1].compile(type);
  if (tExpr.resolved) {
    tExpr.result = getType(tExpr.result);
  }
  return (scope) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!tExpr.resolved) {
      infoArgs[1].resolve(tExpr, scope);
      if (tExpr.error) { return tExpr.error; }
      try { tExpr.result = scope.context.getType(tExpr.result); } catch (e) { return e.message; }
    }
    const value = get(scope.find('$'), pExpr.result);
    const t = tExpr.result;
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
    new Info(isLength, 'path:path', 'options:object?'),
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
