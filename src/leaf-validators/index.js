const deepEqual = require('fast-deep-equal');
const lengthOf = require('@davebaol/length-of');
const bridge = require('./bridge');
const Info = require('../util/info');
const { getType } = require('../util/types');

//
// LEAF VALIDATORS
// They all have no children and exist in 2 flavours:
//  - standard: first argument is a value of type any
//  - suffix $: first argument is a path in the object to validate
//

/* eslint-disable lines-between-class-members */

class Equals extends Info {
  constructor() {
    super('equals', 'value:any', 'other:any', 'deep:boolean?');
  }
  create() {
    return (arg, other, deep) => {
      const [aArg, oArg, dArg] = this.argDescriptors;
      const aExpr = aArg.compile(arg);
      const oExpr = oArg.compile(other);
      const dExpr = dArg.compile(deep);
      return (scope) => {
        if (!aExpr.resolved) {
          if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
        }
        if (!oExpr.resolved) {
          if (oArg.resolve(oExpr, scope).error) { return this.error(oExpr.error); }
        }
        if (!dExpr.resolved) {
          if (dArg.resolve(dExpr, scope).error) { return this.error(dExpr.error); }
        }
        const value = this.getValue(aExpr, scope);
        const result = dExpr.result ? deepEqual(value, oExpr.result) : value === oExpr.result;
        return result ? undefined : this.error(`expected a value equal to ${oExpr.result}`);
      };
    };
  }
}

class IsLength extends Info {
  constructor() {
    super('isLength', 'value:any', 'options:object?');
  }
  create() {
    return (arg, options) => {
      const [aArg, optsArg] = this.argDescriptors;
      const aExpr = aArg.compile(arg);
      const optsExpr = optsArg.compile(options);
      return (scope) => {
        if (!aExpr.resolved) {
          if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
        }
        if (!optsExpr.resolved) {
          if (optsArg.resolve(optsExpr, scope).error) { return this.error(optsExpr.error); }
        }
        const opts = optsExpr.result;
        const min = opts.min || 0;
        const max = opts.max; // eslint-disable-line prefer-destructuring
        const len = lengthOf(this.getValue(aExpr, scope));
        if (len === undefined) {
          return this.error('expected a string, an array or an object');
        }
        return len >= min && (max === undefined || len <= max) ? undefined : this.error(`expected string, array or object of length between ${opts.min} and ${opts.max}`);
      };
    };
  }
}

class IsSet extends Info {
  constructor() {
    super('isSet', 'value:any');
  }
  create() {
    return (arg) => {
      const [aArg] = this.argDescriptors;
      const aExpr = aArg.compile(arg);
      return (scope) => {
        if (!aExpr.resolved) {
          if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
        }
        return this.getValue(aExpr, scope) != null ? undefined : this.error(`the value at path '${arg}' must be set`);
      };
    };
  }
}

class IsType extends Info {
  constructor() {
    super('isType', 'value:any', 'type:string|array');
  }
  create() {
    return (arg, type) => {
      const [aArg, tArg] = this.argDescriptors;
      const aExpr = aArg.compile(arg);
      const tExpr = tArg.compile(type);
      if (tExpr.resolved) {
        tExpr.result = getType(tExpr.result);
      }
      return (scope) => {
        if (!aExpr.resolved) {
          if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
        }
        if (!tExpr.resolved) {
          if (tArg.resolve(tExpr, scope).error) { return this.error(tExpr.error); }
          try { tExpr.result = scope.context.getType(tExpr.result); } catch (e) {
            return this.error(e.message);
          }
        }
        const t = tExpr.result;
        return t.check(this.getValue(aExpr, scope)) ? undefined : this.error(`the value at path '${arg}' must be a '${t.name}'`);
      };
    };
  }
}

class IsOneOf extends Info {
  constructor() {
    super('isOneOf', 'value:any', 'values:array');
  }
  create() {
    return (arg, values) => {
      const [aArg, vArg] = this.argDescriptors;
      const aExpr = aArg.compile(arg);
      const vExpr = vArg.compile(values);
      return (scope) => {
        if (!aExpr.resolved) {
          if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
        }
        if (!vExpr.resolved) {
          if (vArg.resolve(vExpr, scope).error) { return this.error(vExpr.error); }
        }
        return vExpr.result.includes(this.getValue(aExpr, scope)) ? undefined : this.error(`the value at path '${arg}' must be one of ${aExpr.result}`);
      };
    };
  }
}

class IsArrayOf extends Info {
  constructor() {
    super('isArrayOf', 'value:any', 'type:string|array');
  }
  create() {
    return (arg, type) => {
      const [aArg, tArg] = this.argDescriptors;
      const aExpr = aArg.compile(arg);
      const tExpr = tArg.compile(type);
      if (tExpr.resolved) {
        tExpr.result = getType(tExpr.result);
      }
      return (scope) => {
        if (!aExpr.resolved) {
          if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
        }
        if (!tExpr.resolved) {
          if (tArg.resolve(tExpr, scope).error) { return this.error(tExpr.error); }
          try { tExpr.result = scope.context.getType(tExpr.result); } catch (e) {
            return this.error(e.message);
          }
        }
        const value = this.getValue(aExpr, scope);
        const t = tExpr.result;
        if (!Array.isArray(value)) return this.error(`the value at path '${arg}' must be an array`);
        const flag = value.every(e => t.check(e));
        return flag ? undefined : this.error(`the value at path '${arg}' must be an array of '${t.name}'`);
      };
    };
  }
}

function leafValidators() {
  const vInfo = [
    ...Info.variants(Equals),
    ...Info.variants(IsArrayOf),
    ...Info.variants(IsLength),
    ...Info.variants(IsOneOf),
    ...Info.variants(IsSet),
    ...Info.variants(IsType)
  ];

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
