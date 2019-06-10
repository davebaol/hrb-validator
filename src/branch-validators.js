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
  return (scope) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!cExpr.resolved) {
      infoArgs[1].resolve(cExpr, scope);
      if (cExpr.error) { return cExpr.error; }
    }
    scope.context.push$(get(scope.find('$'), pExpr.result));
    const result = cExpr.result(scope);
    scope.context.pop$();
    return result;
  };
}

function def(resources, child) {
  const infoArgs = def.info.argDescriptors;
  const childScope = Scope.compile(undefined, resources); // Parent scope unknown at compile time
  const cExpr = infoArgs[1].compile(child);
  return (scope) => {
    if (!childScope.parent) {
      childScope.setParent(scope);
    }
    if (!childScope.resolved) { // Let's process references
      try { childScope.resolve(); } catch (e) { return e.message; }
    }
    if (!cExpr.resolved) {
      infoArgs[1].resolve(cExpr, childScope);
      if (cExpr.error) { return cExpr.error; }
    }
    return cExpr.result(childScope);
  };
}

function not(child) {
  const infoArgs = not.info.argDescriptors;
  const cExpr = infoArgs[0].compile(child);
  return (scope) => {
    if (!cExpr.resolved) {
      infoArgs[0].resolve(cExpr, scope);
      if (cExpr.error) { return cExpr.error; }
    }
    return cExpr.result(scope) ? undefined : 'not: the child validator must fail';
  };
}

function and(...children) {
  const { info } = and;
  const childArg = info.argDescriptors[0];
  const offspring = info.compileRestParams(children);
  return (scope) => {
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      const cExpr = offspring[i];
      if (!cExpr.resolved) {
        childArg.resolve(cExpr, scope);
        if (cExpr.error) { return cExpr.error; }
      }
      const error = cExpr.result(scope); // Validate child
      if (error) { return error; }
    }
    return undefined;
  };
}

function or(...children) {
  const { info } = or;
  const childArg = info.argDescriptors[0];
  const offspring = info.compileRestParams(children);
  return (scope) => {
    let error;
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      const cExpr = offspring[i];
      if (!cExpr.resolved) {
        childArg.resolve(cExpr, scope);
        if (cExpr.error) { return cExpr.error; }
      }
      error = cExpr.result(scope); // Validate child
      if (!error) { return undefined; }
    }
    return error;
  };
}

function xor(...children) {
  const { info } = xor;
  const childArg = info.argDescriptors[0];
  const offspring = info.compileRestParams(children);
  return (scope) => {
    let count = 0;
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      const cExpr = offspring[i];
      if (!cExpr.resolved) {
        childArg.resolve(cExpr, scope);
        if (cExpr.error) { return cExpr.error; }
      }
      const error = cExpr.result(scope); // Validate child
      count += error ? 0 : 1;
      if (count === 2) { break; }
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
  return (scope) => {
    if (!ccExpr.resolved) {
      infoArgs[0].resolve(ccExpr, scope);
      if (ccExpr.error) { return ccExpr.error; }
    }
    if (!tcExpr.resolved) {
      infoArgs[1].resolve(tcExpr, scope);
      if (tcExpr.error) { return tcExpr.error; }
    }
    if (!ecExpr.resolved) {
      infoArgs[2].resolve(ecExpr, scope);
      if (ecExpr.error) { return ecExpr.error; }
    }
    if (ecExpr.result == null) {
      return ccExpr.result(scope) ? undefined : tcExpr.result(scope);
    }
    // Either then or else is validated, never both!
    return (ccExpr.result(scope) ? ecExpr.result : tcExpr.result)(scope);
  };
}

function every(path, child) {
  const infoArgs = every.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  const cExpr = infoArgs[1].compile(child);
  return (scope) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!cExpr.resolved) {
      infoArgs[1].resolve(cExpr, scope);
      if (cExpr.error) { return cExpr.error; }
    }
    const $ = scope.find('$');
    const value = get($, pExpr.result);
    if (Array.isArray(value)) {
      const new$ = { original: $ };
      scope.context.push$(new$);
      let error;
      const found = value.find((item, index) => {
        new$.value = item;
        new$.index = index;
        error = cExpr.result(scope);
        return error;
      });
      scope.context.pop$();
      return found ? error : undefined;
    }
    if (typeof value === 'object') {
      const new$ = { original: $ };
      scope.context.push$(new$);
      let error;
      const found = Object.keys(value).find((key, index) => {
        new$.key = key;
        new$.value = value[key];
        new$.index = index;
        error = cExpr.result(scope);
        return error;
      });
      scope.context.pop$();
      return found ? error : undefined;
    }
    if (typeof value === 'string') {
      const new$ = { original: $ };
      scope.context.push$(new$);
      let error;
      // eslint-disable-next-line no-cond-assign
      for (let index = 0, char = ''; (char = value.charAt(index)); index += 1) {
        new$.value = char;
        new$.index = index;
        error = cExpr.result(scope);
        if (error) { break; }
      }
      scope.context.pop$();
      return error;
    }
    return `every: the value at path '${path}' must be either a string, an array or an object; found type '${typeof value}'`;
  };
}

function some(path, child) {
  const infoArgs = some.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  const cExpr = infoArgs[1].compile(child);
  return (scope) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!cExpr.resolved) {
      infoArgs[1].resolve(cExpr, scope);
      if (cExpr.error) { return cExpr.error; }
    }
    const $ = scope.find('$');
    const value = get($, pExpr.result);
    if (Array.isArray(value)) {
      const new$ = { original: $ };
      scope.context.push$(new$);
      let error;
      const found = value.find((item, index) => {
        new$.value = item;
        new$.index = index;
        error = cExpr.result(scope);
        return !error;
      });
      scope.context.pop$();
      return found ? undefined : error;
    }
    if (typeof value === 'object') {
      const new$ = { original: $ };
      scope.context.push$(new$);
      let error;
      const found = Object.keys(value).find((key, index) => {
        new$.key = key;
        new$.value = value[key];
        new$.index = index;
        error = cExpr.result(scope);
        return !error;
      });
      scope.context.pop$();
      return found ? undefined : error;
    }
    if (typeof value === 'string') {
      const new$ = { original: $ };
      scope.context.push$(new$);
      let error;
      // eslint-disable-next-line no-cond-assign
      for (let index = 0, char = ''; (char = value.charAt(index)); index += 1) {
        new$.value = char;
        new$.index = index;
        error = cExpr.result(scope);
        if (!error) { break; }
      }
      scope.context.pop$();
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
  return (scope) => {
    if (!sExpr.resolved) {
      infoArgs[0].resolve(sExpr, scope);
      if (sExpr.error) { return sExpr.error; }
    }
    if (!fExpr.resolved) {
      infoArgs[1].resolve(fExpr, scope);
      if (fExpr.error) { return fExpr.error; }
    }
    if (!cExpr.resolved) {
      infoArgs[2].resolve(cExpr, scope);
      if (cExpr.error) { return cExpr.error; }
    }
    const r = cExpr.result(scope) === undefined ? sExpr.result : fExpr.result;
    return r == null ? undefined : r;
  };
}

function onError(result, child) {
  const infoArgs = onError.info.argDescriptors;
  const rExpr = infoArgs[0].compile(result);
  const cExpr = infoArgs[1].compile(child);
  return (scope) => {
    if (!rExpr.resolved) {
      infoArgs[0].resolve(rExpr, scope);
      if (rExpr.error) { return rExpr.error; }
    }
    if (!cExpr.resolved) {
      infoArgs[1].resolve(cExpr, scope);
      if (cExpr.error) { return cExpr.error; }
    }
    if (cExpr.result(scope) === undefined) { return undefined; }
    return rExpr.result == null ? undefined : rExpr.result;
  };
}

// eslint-disable-next-line no-underscore-dangle
function _while(path, condChild, doChild) {
  const infoArgs = _while.info.argDescriptors;
  const pExpr = infoArgs[0].compile(path);
  const ccExpr = infoArgs[1].compile(condChild);
  const dcExpr = infoArgs[2].compile(doChild);
  return (scope) => {
    if (!pExpr.resolved) {
      infoArgs[0].resolve(pExpr, scope);
      if (pExpr.error) { return pExpr.error; }
    }
    if (!ccExpr.resolved) {
      infoArgs[1].resolve(ccExpr, scope);
      if (ccExpr.error) { return ccExpr.error; }
    }
    if (!dcExpr.resolved) {
      infoArgs[2].resolve(dcExpr, scope);
      if (dcExpr.error) { return dcExpr.error; }
    }
    const $ = scope.find('$');
    const value = get($, pExpr.result);
    const status = { succeeded: 0, failed: 0, original: $ };
    if (Array.isArray(value)) {
      scope.context.push$(status);
      let error;
      const found = value.find((item, index) => {
        status.index = index;
        status.value = item;
        error = ccExpr.result(scope);
        if (!error) {
          status.failed += dcExpr.result(scope) ? 1 : 0;
          status.succeeded = index + 1 - status.failed;
        }
        return error;
      });
      scope.context.pop$();
      return found ? error : undefined;
    }
    if (typeof value === 'object') {
      scope.context.push$(status);
      let error;
      const found = Object.keys(value).find((key, index) => {
        status.index = index;
        status.key = key;
        status.value = value[key];
        error = ccExpr.result(scope);
        if (!error) {
          status.failed += dcExpr.result(scope) ? 1 : 0;
          status.succeeded = index + 1 - status.failed;
        }
        return error;
      });
      scope.context.pop$();
      return found ? error : undefined;
    }
    if (typeof value === 'string') {
      scope.context.push$(status);
      let error;
      // eslint-disable-next-line no-cond-assign
      for (let index = 0, char = ''; (char = value.charAt(index)); index += 1) {
        status.index = index;
        status.value = char;
        error = ccExpr.result(scope);
        if (error) { break; }
        status.failed += dcExpr.result(scope) ? 1 : 0;
        status.succeeded = index + 1 - status.failed;
      }
      scope.context.pop$();
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
