const { get } = require('./util/path');
const Context = require('./util/context');
const createShortcuts = require('./util/create-shortcuts');
const { ensureScope, ensureScopeRef } = require('./util/ensure-scope');
const Info = require('./util/info');
const Reference = require('./util/reference');

//
// BRANCH VALIDATORS
// They all take child validators as arguments.
//

function call(path, child) {
  const infoArgs = call.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  let c = infoArgs[1].ensure(child);
  return (obj, ctx = new Context()) => {
    if (p instanceof Reference) {
      try { p = infoArgs[0].ensureRef(p, ctx, obj); } catch (e) { return e.message; }
    }
    if (c instanceof Reference) {
      try { c = infoArgs[1].ensureRef(c, ctx, obj); } catch (e) { return e.message; }
    }
    return c(get(obj, p), ctx);
  };
}

function def(scope, child) {
  const infoArgs = def.info.argDescriptors;
  // let s = infoArgs[0].ensure(scope, true); // non referenceable object (refDepth = -1)
  let s = ensureScope(scope, false); // non referenceable object (refDepth = -1)
  let c = infoArgs[1].ensure(child);
  return (obj, ctx = new Context()) => {
    if (s !== scope) { // Let's process references
      // Create and push into the context a fresh new scope where properties are
      // added as soon as they are resolved. This way backward references are allowed,
      // while forward referesences are not.
      const freshScope = {};
      ctx.push(freshScope);
      try {
        s = ensureScopeRef(freshScope, s, ctx, obj);
      } catch (e) {
        return e.message;
      }
    } else {
      ctx.push(s);
    }
    if (c instanceof Reference) {
      try { c = infoArgs[1].ensureRef(c, ctx, obj); } catch (e) { return e.message; }
    }
    const result = c(obj, ctx);
    ctx.pop();
    return result;
  };
}

function not(child) {
  const infoArgs = not.info.argDescriptors;
  let c = infoArgs[0].ensure(child);
  return (obj, ctx = new Context()) => {
    if (c instanceof Reference) {
      try { c = infoArgs[0].ensureRef(c, ctx, obj); } catch (e) { return e.message; }
    }
    return c(obj, ctx) ? undefined : 'not: the child validator must fail';
  };
}

function and(...children) {
  const { info } = and;
  const childArg = info.argDescriptors[0];
  const offspring = info.ensureRestParams(children);
  return (obj, ctx = new Context()) => {
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      if (offspring[i] instanceof Reference) {
        try {
          // replace the ref with the validator
          offspring[i] = childArg.ensureRef(offspring[i], ctx, obj);
        } catch (e) { return e.message; }
      }
      const error = offspring[i](obj, ctx); // Validate child
      if (error) {
        return error;
      }
    }
    return undefined;
  };
}

function or(...children) {
  const { info } = or;
  const childArg = info.argDescriptors[0];
  const offspring = info.ensureRestParams(children);
  return (obj, ctx = new Context()) => {
    let error;
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      if (offspring[i] instanceof Reference) {
        try {
          // replace the ref with the validator
          offspring[i] = childArg.ensureRef(offspring[i], ctx, obj);
        } catch (e) { return e.message; }
      }
      error = offspring[i](obj, ctx); // Validate child
      if (!error) {
        return undefined;
      }
    }
    return error;
  };
}

function xor(...children) {
  const { info } = xor;
  const childArg = info.argDescriptors[0];
  const offspring = info.ensureRestParams(children);
  return (obj, ctx = new Context()) => {
    let count = 0;
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      if (offspring[i] instanceof Reference) {
        try {
          // replace the ref with the validator
          offspring[i] = childArg.ensureRef(offspring[i], ctx, obj);
        } catch (e) { return e.message; }
      }
      const error = offspring[i](obj, ctx); // Validate child
      count += error ? 0 : 1;
      if (count === 2) {
        break;
      }
    }
    return count === 1 ? undefined : `xor: expected exactly 1 valid child; found ${count} instead`;
  };
}

// eslint-disable-next-line no-underscore-dangle
function _if(condChild, thenChild, elseChild) {
  const infoArgs = _if.info.argDescriptors;
  let cc = infoArgs[0].ensure(condChild);
  let tc = infoArgs[1].ensure(thenChild);
  let ec = infoArgs[2].ensure(elseChild);
  return (obj, ctx = new Context()) => {
    if (cc instanceof Reference) {
      try { cc = infoArgs[0].ensureRef(cc, ctx, obj); } catch (e) { return e.message; }
    }
    if (tc instanceof Reference) {
      try { tc = infoArgs[1].ensureRef(tc, ctx, obj); } catch (e) { return e.message; }
    }
    if (ec instanceof Reference) {
      try { ec = infoArgs[2].ensureRef(ec, ctx, obj); } catch (e) { return e.message; }
    }
    if (ec == null) {
      return cc(obj, ctx) ? undefined : tc(obj, ctx);
    }
    return (cc(obj, ctx) ? ec : tc)(obj, ctx); // either then or else is validated, not both!
  };
}

function every(path, child) {
  const infoArgs = every.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  let c = infoArgs[1].ensure(child);
  return (obj, ctx = new Context()) => {
    if (p instanceof Reference) {
      try { p = infoArgs[0].ensureRef(p, ctx, obj); } catch (e) { return e.message; }
    }
    if (c instanceof Reference) {
      try { c = infoArgs[1].ensureRef(c, ctx); } catch (e) { return e.message; }
    }
    const value = get(obj, p);
    if (Array.isArray(value)) {
      let error;
      const found = value.find((item, index) => {
        error = c({ index, value: item, original: obj }, ctx);
        return error;
      });
      return found ? error : undefined;
    }
    if (typeof value === 'object') {
      let error;
      const found = Object.keys(value).find((key, index) => {
        error = c({
          index, key, value: value[key], original: obj
        }, ctx);
        return error;
      });
      return found ? error : undefined;
    }
    if (typeof value === 'string') {
      let error;
      // eslint-disable-next-line no-cond-assign
      for (let index = 0, char = ''; (char = value.charAt(index)); index += 1) {
        error = c({ index, value: char, original: obj }, ctx);
        if (error) {
          break;
        }
      }
      return error;
    }
    return `every: the value at path '${path}' must be either a string, an array or an object; found type '${typeof value}'`;
  };
}

function some(path, child) {
  const infoArgs = some.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  let c = infoArgs[1].ensure(child);
  return (obj, ctx = new Context()) => {
    if (p instanceof Reference) {
      try { p = infoArgs[0].ensureRef(p, ctx, obj); } catch (e) { return e.message; }
    }
    if (c instanceof Reference) {
      try { c = infoArgs[1].ensureRef(c, ctx); } catch (e) { return e.message; }
    }
    const value = get(obj, p);
    if (Array.isArray(value)) {
      let error;
      const found = value.find((item, index) => {
        error = c({ index, value: item, original: obj }, ctx);
        return !error;
      });
      return found ? undefined : error;
    }
    if (typeof value === 'object') {
      let error;
      const found = Object.keys(value).find((key, index) => {
        error = c({
          index, key, value: value[key], original: obj
        }, ctx);
        return !error;
      });
      return found ? undefined : error;
    }
    if (typeof value === 'string') {
      let error;
      // eslint-disable-next-line no-cond-assign
      for (let index = 0, char = ''; (char = value.charAt(index)); index += 1) {
        error = c({ index, value: char, original: obj }, ctx);
        if (!error) {
          break;
        }
      }
      return error;
    }
    return `some: the value at path '${path}' must be either a string, an array or an object; found type '${typeof value}' instead`;
  };
}

function alter(resultOnSuccess, resultOnError, child) {
  const infoArgs = alter.info.argDescriptors;
  let s = infoArgs[0].ensure(resultOnSuccess);
  let f = infoArgs[1].ensure(resultOnError);
  let c = infoArgs[2].ensure(child);
  return (obj, ctx = new Context()) => {
    if (s instanceof Reference) {
      try { s = infoArgs[0].ensureRef(s, ctx, obj); } catch (e) { return e.message; }
    }
    if (f instanceof Reference) {
      try { f = infoArgs[1].ensureRef(f, ctx, obj); } catch (e) { return e.message; }
    }
    if (c instanceof Reference) {
      try { c = infoArgs[2].ensureRef(c, ctx, obj); } catch (e) { return e.message; }
    }
    const r = c(obj, ctx) === undefined ? s : f;
    return r == null ? undefined : r;
  };
}

function onError(result, child) {
  const infoArgs = onError.info.argDescriptors;
  let r = infoArgs[0].ensure(result);
  let c = infoArgs[1].ensure(child);
  return (obj, ctx = new Context()) => {
    if (r instanceof Reference) {
      try { r = infoArgs[0].ensureRef(r, ctx, obj); } catch (e) { return e.message; }
    }
    if (c instanceof Reference) {
      try { c = infoArgs[1].ensureRef(c, ctx, obj); } catch (e) { return e.message; }
    }
    if (c(obj, ctx) === undefined) { return undefined; }
    return r == null ? undefined : r;
  };
}

// eslint-disable-next-line no-underscore-dangle
function _while(path, condChild, doChild) {
  const infoArgs = _while.info.argDescriptors;
  let p = infoArgs[0].ensure(path);
  let cc = infoArgs[1].ensure(condChild);
  let dc = infoArgs[2].ensure(doChild);
  return (obj, ctx = new Context()) => {
    if (p instanceof Reference) {
      try { p = infoArgs[0].ensureRef(p, ctx, obj); } catch (e) { return e.message; }
    }
    if (cc instanceof Reference) {
      try { cc = infoArgs[1].ensureRef(cc, ctx, obj); } catch (e) { return e.message; }
    }
    if (dc instanceof Reference) {
      try { dc = infoArgs[2].ensureRef(dc, ctx, obj); } catch (e) { return e.message; }
    }
    const value = get(obj, p);
    const status = { succeeded: 0, failed: 0, original: obj };
    if (Array.isArray(value)) {
      let error;
      const found = value.find((item, index) => {
        status.index = index;
        status.value = item;
        error = cc(status, ctx);
        if (!error) {
          status.failed += dc(status, ctx) ? 1 : 0;
          status.succeeded = index + 1 - status.failed;
        }
        return error;
      });
      return found ? error : undefined;
    }
    if (typeof value === 'object') {
      let error;
      const found = Object.keys(value).find((key, index) => {
        status.index = index;
        status.key = key;
        status.value = value[key];
        error = cc(status, ctx);
        if (!error) {
          status.failed += dc(status, ctx) ? 1 : 0;
          status.succeeded = index + 1 - status.failed;
        }
        return error;
      });
      return found ? error : undefined;
    }
    if (typeof value === 'string') {
      let error;
      // eslint-disable-next-line no-cond-assign
      for (let index = 0, char = ''; (char = value.charAt(index)); index += 1) {
        status.index = index;
        status.value = char;
        error = cc(status, ctx);
        if (error) {
          break;
        }
        status.failed += dc(status, ctx) ? 1 : 0;
        status.succeeded = index + 1 - status.failed;
      }
      return error;
    }
    return `while: the value at path '${path}' must be either a string, an array or an object; found type '${typeof value}'`;
  };
}

function branchValidators() {
  /* eslint-disable no-unused-vars */
  /* istanbul ignore next */
  const vInfo = [
    new Info(call, 'path:path', 'child:child'),
    new Info(def, { def: 'scope:object', refDepth: -1 }, 'child:child'),
    new Info(not, 'child:child'),
    new Info(and, '...child:child'),
    new Info(or, '...child:child'),
    new Info(xor, '...child:child'),
    new Info(_if, 'cond:child', 'then:child', 'else:child?'),
    new Info(every, 'path:path', 'child:child'),
    new Info(some, 'path:path', 'child:child'),
    new Info(alter, 'resultOnSuccess:any?', 'resultOnError:any?', 'child:child'),
    new Info(onError, 'result:any?', 'child:child'),
    new Info(_while, 'path:path', 'cond:child', 'do:child')
  ];
  /* eslint-enable no-unused-vars */

  const target = vInfo.reduce((acc, info) => {
    info.consolidate();
    const k = info.name;
    acc[k] = info.validator; // eslint-disable-line no-param-reassign
    return acc;
  }, {});

  // Augment with shortcut 'opt' all branch validators taking a path as first argument
  createShortcuts(target, target, ['call', 'every', 'some', 'while']);

  return target;
}

module.exports = branchValidators();
