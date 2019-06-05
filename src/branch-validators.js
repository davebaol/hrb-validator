const { get } = require('./util/path');
const Scope = require('./util/scope');
const createShortcuts = require('./util/create-shortcuts');
const Info = require('./util/info');

//
// BRANCH VALIDATORS
// They all take child validators as arguments.
//

function call(path, child) {
  const infoArgs = call.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  const cExpr = infoArgs[1].compile(child);
  return (obj, scope = new Scope()) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope, obj);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!cExpr.resolved) {
      infoArgs[1].resolve(cExpr, scope, obj);
      if (cExpr.error) { return cExpr.error; }
    }
    return cExpr.result(get(obj, pExpr.result), scope);
  };
}

function def(resources, child) {
  const infoArgs = def.info.argDescriptors;
  // const sExpr = infoArgs[0].compile(scope, true); // non referenceable object (refDepth = -1)
  const childScope = Scope.compile(resources);
  const cExpr = infoArgs[1].compile(child);
  return (obj, scope) => {
    if (!childScope.parent) {
      childScope.setParent(scope);
    }
    if (!childScope.resolved) { // Let's process references
      try {
        childScope.resolve(obj);
      } catch (e) {
        return e.message;
      }
    }
    if (!cExpr.resolved) {
      infoArgs[1].resolve(cExpr, childScope, obj);
      if (cExpr.error) { return cExpr.error; }
    }
    return cExpr.result(obj, childScope);
  };
}

function not(child) {
  const infoArgs = not.info.argDescriptors;
  const cExpr = infoArgs[0].compile(child);
  return (obj, scope = new Scope()) => {
    if (!cExpr.resolved) {
      infoArgs[0].resolve(cExpr, scope, obj);
      if (cExpr.error) { return cExpr.error; }
    }
    return cExpr.result(obj, scope) ? undefined : 'not: the child validator must fail';
  };
}

function and(...children) {
  const { info } = and;
  const childArg = info.argDescriptors[0];
  const offspring = info.compileRestParams(children);
  return (obj, scope = new Scope()) => {
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      const cExpr = offspring[i];
      if (!cExpr.resolved) {
        childArg.resolve(cExpr, scope, obj);
        if (cExpr.error) { return cExpr.error; }
      }
      const error = (cExpr.result)(obj, scope); // Validate child
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
  const offspring = info.compileRestParams(children);
  return (obj, scope = new Scope()) => {
    let error;
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      const cExpr = offspring[i];
      if (!cExpr.resolved) {
        childArg.resolve(cExpr, scope, obj);
        if (cExpr.error) { return cExpr.error; }
      }
      error = (cExpr.result)(obj, scope); // Validate child
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
  const offspring = info.compileRestParams(children);
  return (obj, scope = new Scope()) => {
    let count = 0;
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      const cExpr = offspring[i];
      if (!cExpr.resolved) {
        childArg.resolve(cExpr, scope, obj);
        if (cExpr.error) { return cExpr.error; }
      }
      const error = (cExpr.result)(obj, scope); // Validate child
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
  const ccExpr = infoArgs[0].compile(condChild);
  const tcExpr = infoArgs[1].compile(thenChild);
  const ecExpr = infoArgs[2].compile(elseChild);
  return (obj, scope = new Scope()) => {
    if (!ccExpr.resolved) {
      infoArgs[0].resolve(ccExpr, scope, obj);
      if (ccExpr.error) { return ccExpr.error; }
    }
    if (!tcExpr.resolved) {
      infoArgs[1].resolve(tcExpr, scope, obj);
      if (tcExpr.error) { return tcExpr.error; }
    }
    if (!ecExpr.resolved) {
      infoArgs[2].resolve(ecExpr, scope, obj);
      if (ecExpr.error) { return ecExpr.error; }
    }
    if (ecExpr.result == null) {
      return ccExpr.result(obj, scope) ? undefined : tcExpr.result(obj, scope);
    }
    // either then or else is validated, not both!
    return (ccExpr.result(obj, scope) ? ecExpr.result : tcExpr.result)(obj, scope);
  };
}

function every(path, child) {
  const infoArgs = every.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  const cExpr = infoArgs[1].compile(child);
  return (obj, scope = new Scope()) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope, obj);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!cExpr.resolved) {
      infoArgs[1].resolve(cExpr, scope);
      if (cExpr.error) { return cExpr.error; }
    }
    const value = get(obj, pExpr.result);
    if (Array.isArray(value)) {
      let error;
      const found = value.find((item, index) => {
        error = cExpr.result({ index, value: item, original: obj }, scope);
        return error;
      });
      return found ? error : undefined;
    }
    if (typeof value === 'object') {
      let error;
      const found = Object.keys(value).find((key, index) => {
        error = cExpr.result({
          index, key, value: value[key], original: obj
        }, scope);
        return error;
      });
      return found ? error : undefined;
    }
    if (typeof value === 'string') {
      let error;
      // eslint-disable-next-line no-cond-assign
      for (let index = 0, char = ''; (char = value.charAt(index)); index += 1) {
        error = cExpr.result({ index, value: char, original: obj }, scope);
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
  const pExpr = infoArgs[0].compile(path);
  const cExpr = infoArgs[1].compile(child);
  return (obj, scope = new Scope()) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope, obj);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!cExpr.resolved) {
      infoArgs[1].resolve(cExpr, scope);
      if (cExpr.error) { return cExpr.error; }
    }
    const value = get(obj, pExpr.result);
    if (Array.isArray(value)) {
      let error;
      const found = value.find((item, index) => {
        error = cExpr.result({ index, value: item, original: obj }, scope);
        return !error;
      });
      return found ? undefined : error;
    }
    if (typeof value === 'object') {
      let error;
      const found = Object.keys(value).find((key, index) => {
        error = cExpr.result({
          index, key, value: value[key], original: obj
        }, scope);
        return !error;
      });
      return found ? undefined : error;
    }
    if (typeof value === 'string') {
      let error;
      // eslint-disable-next-line no-cond-assign
      for (let index = 0, char = ''; (char = value.charAt(index)); index += 1) {
        error = cExpr.result({ index, value: char, original: obj }, scope);
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
  const sExpr = infoArgs[0].compile(resultOnSuccess);
  const fExpr = infoArgs[1].compile(resultOnError);
  const cExpr = infoArgs[2].compile(child);
  return (obj, scope = new Scope()) => {
    if (!sExpr.resolved) {
      infoArgs[0].resolve(sExpr, scope, obj);
      if (sExpr.error) { return sExpr.error; }
    }
    if (!fExpr.resolved) {
      infoArgs[1].resolve(fExpr, scope, obj);
      if (fExpr.error) { return fExpr.error; }
    }
    if (!cExpr.resolved) {
      infoArgs[2].resolve(cExpr, scope, obj);
      if (cExpr.error) { return cExpr.error; }
    }
    const r = cExpr.result(obj, scope) === undefined ? sExpr.result : fExpr.result;
    return r == null ? undefined : r;
  };
}

function onError(result, child) {
  const infoArgs = onError.info.argDescriptors;
  const rExpr = infoArgs[0].compile(result);
  const cExpr = infoArgs[1].compile(child);
  return (obj, scope = new Scope()) => {
    if (!rExpr.resolved) {
      infoArgs[0].resolve(rExpr, scope, obj);
      if (rExpr.error) { return rExpr.error; }
    }
    if (!cExpr.resolved) {
      infoArgs[1].resolve(cExpr, scope, obj);
      if (cExpr.error) { return cExpr.error; }
    }
    if (cExpr.result(obj, scope) === undefined) { return undefined; }
    return rExpr.result == null ? undefined : rExpr.result;
  };
}

// eslint-disable-next-line no-underscore-dangle
function _while(path, condChild, doChild) {
  const infoArgs = _while.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  const ccExpr = infoArgs[1].compile(condChild);
  const dcExpr = infoArgs[2].compile(doChild);
  return (obj, scope = new Scope()) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope, obj);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!ccExpr.resolved) {
      infoArgs[1].resolve(ccExpr, scope, obj);
      if (ccExpr.error) { return ccExpr.error; }
    }
    if (!dcExpr.resolved) {
      infoArgs[2].resolve(dcExpr, scope, obj);
      if (dcExpr.error) { return dcExpr.error; }
    }
    const value = get(obj, pExpr.result);
    const status = { succeeded: 0, failed: 0, original: obj };
    if (Array.isArray(value)) {
      let error;
      const found = value.find((item, index) => {
        status.index = index;
        status.value = item;
        error = ccExpr.result(status, scope);
        if (!error) {
          status.failed += dcExpr.result(status, scope) ? 1 : 0;
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
        error = ccExpr.result(status, scope);
        if (!error) {
          status.failed += dcExpr.result(status, scope) ? 1 : 0;
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
        error = ccExpr.result(status, scope);
        if (error) {
          break;
        }
        status.failed += dcExpr.result(status, scope) ? 1 : 0;
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
