const { get } = require('./util/path');
const Context = require('./util/context');
const createShortcuts = require('./util/create-shortcuts');
const ensureArg = require('./util/ensure-arg');
const Info = require('./util/info');

const { REF } = ensureArg;

//
// BRANCH VALIDATORS
// They all take child validators as arguments.
//

function call(path, child) {
  let p = ensureArg.path(path);
  let c = ensureArg.child(child);
  return (obj, ctx) => {
    if (p === REF) {
      try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (c === REF) {
      try { c = ensureArg.childRef(child, ctx); } catch (e) { return e.message; }
    }
    return c(get(obj, p), ctx);
  };
}

function def(scope, child) {
  let s = ensureArg.scope(scope || {});
  let c = ensureArg.child(child);
  return (obj, ctx) => {
    // eslint-disable-next-line no-param-reassign
    ctx = ctx || new Context();
    if (s === REF) {
      try { s = ensureArg.scopeRef(scope, ctx, obj); } catch (e) { return e.message; }
    }
    ctx.push(scope);
    if (c === REF) {
      try { c = ensureArg.childRef(child, ctx); } catch (e) { return e.message; }
    }
    const result = c(obj, ctx);
    ctx.pop();
    return result;
  };
}

function not(child) {
  let c = ensureArg.child(child);
  return (obj, ctx) => {
    if (c === REF) {
      try { c = ensureArg.childRef(child, ctx); } catch (e) { return e.message; }
    }
    return c(obj, ctx) ? undefined : 'not: the child validator must fail';
  };
}

function and(...children) {
  const offspring = ensureArg.children(children);
  return (obj, ctx) => {
    let error;
    const invalidChild = offspring.find((child, i) => {
      let c = child;
      if (c === REF) {
        try { c = ensureArg.childRef(children[i], ctx); } catch (e) { return e.message; }
        offspring[i] = c; // replace the ref with the validator
      }
      error = c(obj, ctx);
      return error;
    });
    return invalidChild ? error : undefined;
  };
}

function or(...children) {
  const offspring = ensureArg.children(children);
  return (obj, ctx) => {
    let error;
    const validChild = offspring.find((child, i) => {
      let c = child;
      if (c === REF) {
        try { c = ensureArg.childRef(children[i], ctx); } catch (e) { return e.message; }
        offspring[i] = c; // replace the ref with the validator
      }
      error = c(obj, ctx);
      return !error;
    });
    return validChild ? undefined : error;
  };
}

function xor(...children) {
  const offspring = ensureArg.children(children);
  return (obj, ctx) => {
    let count = 0;
    offspring.find((child, i) => {
      let c = child;
      if (c === REF) {
        try { c = ensureArg.childRef(children[i], ctx); } catch (e) { return e.message; }
        offspring[i] = c; // replace the ref with the validator
      }
      const error = c(obj, ctx);
      count += error ? 0 : 1;
      return count === 2;
    });
    return count === 1 ? undefined : `xor: expected exactly 1 valid child; found ${count} instead`;
  };
}

// eslint-disable-next-line no-underscore-dangle
function _if(condChild, thenChild, elseChild) {
  let cc = ensureArg.child(condChild);
  let tc = ensureArg.child(thenChild);
  let ec = elseChild == null ? undefined : ensureArg.child(elseChild);
  return (obj, ctx) => {
    if (cc === REF) {
      try { cc = ensureArg.childRef(condChild, ctx); } catch (e) { return e.message; }
    }
    if (tc === REF) {
      try { tc = ensureArg.childRef(thenChild, ctx); } catch (e) { return e.message; }
    }
    if (ec === REF) {
      try { ec = ensureArg.childRef(elseChild, ctx); } catch (e) { return e.message; }
    }
    if (ec == null) {
      return cc(obj, ctx) ? undefined : tc(obj, ctx);
    }
    return (cc(obj, ctx) ? ec : tc)(obj, ctx); // either then or else is validated, not both!
  };
}

function every(path, child) {
  let p = ensureArg.path(path);
  let c = ensureArg.child(child);
  return (obj, ctx) => {
    if (p === REF) {
      try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (c === REF) {
      try { c = ensureArg.childRef(child, ctx); } catch (e) { return e.message; }
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
  let p = ensureArg.path(path);
  let c = ensureArg.child(child);
  return (obj, ctx) => {
    if (p === REF) {
      try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (c === REF) {
      try { c = ensureArg.childRef(child, ctx); } catch (e) { return e.message; }
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

function alter(child, resultOnSuccess, resultOnError) {
  let c = ensureArg.child(child);
  let s = resultOnSuccess == null ? undefined : ensureArg.any(resultOnSuccess);
  let f = resultOnError == null ? undefined : ensureArg.any(resultOnError);
  return (obj, ctx) => {
    if (c === REF) {
      try { c = ensureArg.childRef(child, ctx); } catch (e) { return e.message; }
    }
    if (s === REF) {
      try { s = ensureArg.anyRef(resultOnSuccess, ctx); } catch (e) { return e.message; }
      s = s == null ? undefined : s;
    }
    if (f === REF) {
      try { f = ensureArg.anyRef(resultOnError, ctx); } catch (e) { return e.message; }
      f = f == null ? undefined : f;
    }
    return c(obj, ctx) ? f : s;
  };
}

function onError(error, child) {
  let f = error == null ? undefined : ensureArg.any(error);
  let c = ensureArg.child(child);
  return (obj, ctx) => {
    if (c === REF) {
      try { c = ensureArg.childRef(child, ctx); } catch (e) { return e.message; }
    }
    if (f === REF) {
      try { f = ensureArg.anyRef(error, ctx); } catch (e) { return e.message; }
      f = f == null ? undefined : f;
    }
    return c(obj, ctx) ? f : undefined;
  };
}

// eslint-disable-next-line no-underscore-dangle
function _while(path, condChild, doChild) {
  let p = ensureArg.path(path);
  let cc = ensureArg.child(condChild);
  let dc = ensureArg.child(doChild);
  return (obj, ctx) => {
    if (p === REF) {
      try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
    }
    if (cc === REF) {
      try { cc = ensureArg.childRef(condChild, ctx); } catch (e) { return e.message; }
    }
    if (dc === REF) {
      try { dc = ensureArg.childRef(doChild, ctx); } catch (e) { return e.message; }
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
    new Info(def, 'scope:object', 'child:child'),
    new Info(not, 'child:child'),
    new Info(and, '...child:child'),
    new Info(or, '...child:child'),
    new Info(xor, '...child:child'),
    new Info(_if, 'cond:child', 'then:child', 'else:child?'),
    new Info(every, 'path:path', 'child:child'),
    new Info(some, 'path:path', 'child:child'),
    new Info(alter, 'child:child', 'success:any', 'failure:any'),
    new Info(onError, 'error:any', 'child:child'),
    new Info(_while, 'path:path', 'cond:child', 'do:child')
  ];
  /* eslint-enable no-unused-vars */

  const target = vInfo.reduce((acc, info) => {
    const k = info.name;
    acc[k] = info.validator; // eslint-disable-line no-param-reassign
    return acc;
  }, {});

  // Augment with shortcut 'opt' all branch validators taking a path as first argument
  createShortcuts(target, target, ['call', 'every', 'some', 'while']);

  return target;
}

module.exports = branchValidators();
