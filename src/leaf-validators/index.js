const deepEqual = require('fast-deep-equal');
const lengthOf = require('@davebaol/length-of');
const bridge = require('./bridge');
const { infoVariants$ } = require('../util/variants');
const { getType } = require('../util/types');

//
// LEAF VALIDATORS
// They all have no children and exist in 2 flavours:
//  - standard: first argument is a value of type any
//  - suffix $: first argument is a path in the object to validate
//

function equals(info, arg, other, deep) {
  const [aArg, oArg, dArg] = info.argDescriptors;
  const aExpr = aArg.compile(arg);
  const oExpr = oArg.compile(other);
  const dExpr = dArg.compile(deep);
  return (scope) => {
    if (!aExpr.resolved) {
      aArg.resolve(aExpr, scope);
      if (aExpr.error) { return aExpr.error; }
    }
    if (!oExpr.resolved) {
      oArg.resolve(oExpr, scope);
      if (oExpr.error) { return oExpr.error; }
    }
    if (!dExpr.resolved) {
      dArg.resolve(dExpr, scope);
      if (dExpr.error) { return dExpr.error; }
    }
    const value = info.getValue(aExpr, scope);
    const result = dExpr.result ? deepEqual(value, oExpr.result) : value === oExpr.result;
    return result ? undefined : `${info.name}: expected a value equal to ${oExpr.result}`;
  };
}

function isLength(info, arg, options) {
  const [aArg, optsArg] = info.argDescriptors;
  const aExpr = aArg.compile(arg);
  const optsExpr = optsArg.compile(options);
  return (scope) => {
    if (!aExpr.resolved) {
      aArg.resolve(aExpr, scope);
      if (aExpr.error) { return aExpr.error; }
    }
    if (!optsExpr.resolved) {
      optsArg.resolve(optsExpr, scope);
      if (optsExpr.error) { return optsExpr.error; }
    }
    const opts = optsExpr.result;
    const min = opts.min || 0;
    const max = opts.max; // eslint-disable-line prefer-destructuring
    const len = lengthOf(info.getValue(aExpr, scope));
    if (len === undefined) {
      return `${info.name}: expected a string, an array or an object`;
    }
    return len >= min && (max === undefined || len <= max) ? undefined : `${info.name}: expected string, array or object of length between ${opts.min} and ${opts.max}`;
  };
}

function isSet(info, arg) {
  const [aArg] = info.argDescriptors;
  const aExpr = aArg.compile(arg);
  return (scope) => {
    if (!aExpr.resolved) {
      aArg.resolve(aExpr, scope);
      if (aExpr.error) { return aExpr.error; }
    }
    return info.getValue(aExpr, scope) != null ? undefined : `${info.name}: the value at path '${arg}' must be set`;
  };
}

function isType(info, arg, type) {
  const [aArg, tArg] = info.argDescriptors;
  const aExpr = aArg.compile(arg);
  const tExpr = tArg.compile(type);
  if (tExpr.resolved) {
    tExpr.result = getType(tExpr.result);
  }
  return (scope) => {
    if (!aExpr.resolved) {
      aArg.resolve(aExpr, scope);
      if (aExpr.error) { return aExpr.error; }
    }
    if (!tExpr.resolved) {
      tArg.resolve(tExpr, scope);
      if (tExpr.error) { return tExpr.error; }
      try { tExpr.result = scope.context.getType(tExpr.result); } catch (e) { return e.message; }
    }
    const t = tExpr.result;
    return t.check(info.getValue(aExpr, scope)) ? undefined : `${info.name}: the value at path '${arg}' must be a '${t.name}'`;
  };
}

function isOneOf(info, arg, values) {
  const [aArg, vArg] = info.argDescriptors;
  const aExpr = aArg.compile(arg);
  const vExpr = vArg.compile(values);
  return (scope) => {
    if (!aExpr.resolved) {
      aArg.resolve(aExpr, scope);
      if (aExpr.error) { return aExpr.error; }
    }
    if (!vExpr.resolved) {
      vArg.resolve(vExpr, scope);
      if (vExpr.error) { return vExpr.error; }
    }
    return vExpr.result.includes(info.getValue(aExpr, scope)) ? undefined : `${info.name}: the value at path '${arg}' must be one of ${aExpr.result}`;
  };
}

function isArrayOf(info, arg, type) {
  const [aArg, tArg] = info.argDescriptors;
  const aExpr = aArg.compile(arg);
  const tExpr = tArg.compile(type);
  if (tExpr.resolved) {
    tExpr.result = getType(tExpr.result);
  }
  return (scope) => {
    if (!aExpr.resolved) {
      aArg.resolve(aExpr, scope);
      if (aExpr.error) { return aExpr.error; }
    }
    if (!tExpr.resolved) {
      tArg.resolve(tExpr, scope);
      if (tExpr.error) { return tExpr.error; }
      try { tExpr.result = scope.context.getType(tExpr.result); } catch (e) { return e.message; }
    }
    const value = info.getValue(aExpr, scope);
    const t = tExpr.result;
    if (!Array.isArray(value)) return `${info.name}: the value at path '${arg}' must be an array`;
    const flag = value.every(e => t.check(e));
    return flag ? undefined : `${info.name}: the value at path '${arg}' must be an array of '${t.name}'`;
  };
}

function leafValidators() {
  /* eslint-disable no-unused-vars */
  const vInfo = [
    ...infoVariants$(equals, 'value:any', 'other:any', 'deep:boolean?'),
    ...infoVariants$(isArrayOf, 'value:any', 'type:string|array'),
    ...infoVariants$(isLength, 'value:any', 'options:object?'),
    ...infoVariants$(isOneOf, 'value:any', 'values:array'),
    ...infoVariants$(isSet, 'value:any'),
    ...infoVariants$(isType, 'value:any', 'type:string|array')
  ];
  /* eslint-enable no-unused-vars */

  const target = vInfo.reduce((acc, info) => {
    const k = info.name;
    acc[k] = info.validator; // eslint-disable-line no-param-reassign
    return acc;
  }, {});

  // Augment leaf validators with the ones bridged from validator package
  bridge(target);

  return target;
}

module.exports = leafValidators();
