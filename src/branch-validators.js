const Scope = require('./util/scope');
const { infoVariant, infoVariants$ } = require('./util/variants');

//
// BRANCH VALIDATORS
// They all take at least one child validator as arguments.
//

function call(info, arg, child) {
  const [aArg, cArg] = info.argDescriptors;
  const aExpr = aArg.compile(arg);
  const cExpr = cArg.compile(child);
  return (scope) => {
    if (!aExpr.resolved) {
      if (aArg.resolve(aExpr, scope).error) { return info.error(aExpr.error); }
    }
    if (!cExpr.resolved) {
      if (cArg.resolve(cExpr, scope).error) { return info.error(cExpr.error); }
    }
    scope.context.push$(info.getValue(aExpr, scope));
    const result = cExpr.result(scope);
    scope.context.pop$();
    return result;
  };
}

function def(resources, child) {
  const childScope = Scope.compile(undefined, resources); // Parent scope unknown at compile time
  const { info } = def;
  const cArg = info.argDescriptors[1];
  const cExpr = cArg.compile(child);
  return (scope) => {
    if (!childScope.parent) {
      childScope.setParent(scope);
    }
    if (!childScope.resolved) { // Let's process references
      try { childScope.resolve(); } catch (e) { return info.error(e.message); }
    }
    if (!cExpr.resolved) {
      if (cArg.resolve(cExpr, childScope).error) { return info.error(cExpr.error); }
    }
    return cExpr.result(childScope);
  };
}

function not(child) {
  const { info } = not;
  const [cArg] = info.argDescriptors;
  const cExpr = cArg.compile(child);
  return (scope) => {
    if (!cExpr.resolved) {
      if (cArg.resolve(cExpr, scope).error) { return info.error(cExpr.error); }
    }
    return cExpr.result(scope) ? undefined : info.error('the child validator must fail');
  };
}

function and(...children) {
  const { info } = and;
  const [cArg] = info.argDescriptors;
  const offspring = info.compileRestParams(children);
  return (scope) => {
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      const cExpr = offspring[i];
      if (!cExpr.resolved) {
        if (cArg.resolve(cExpr, scope).error) { return info.error(cExpr.error); }
      }
      const error = cExpr.result(scope); // Validate child
      if (error) { return error; }
    }
    return undefined;
  };
}

function or(...children) {
  const { info } = or;
  const [cArg] = info.argDescriptors;
  const offspring = info.compileRestParams(children);
  return (scope) => {
    let error;
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      const cExpr = offspring[i];
      if (!cExpr.resolved) {
        if (cArg.resolve(cExpr, scope).error) { return info.error(cExpr.error); }
      }
      error = cExpr.result(scope); // Validate child
      if (!error) { return undefined; }
    }
    return error;
  };
}

function xor(...children) {
  const { info } = xor;
  const [cArg] = info.argDescriptors;
  const offspring = info.compileRestParams(children);
  return (scope) => {
    let count = 0;
    for (let i = 0, len = offspring.length; i < len; i += 1) {
      const cExpr = offspring[i];
      if (!cExpr.resolved) {
        if (cArg.resolve(cExpr, scope).error) { return info.error(cExpr.error); }
      }
      const error = cExpr.result(scope); // Validate child
      count += error ? 0 : 1;
      if (count === 2) { break; }
    }
    return count === 1 ? undefined : info.error(`expected exactly 1 valid child; found ${count} instead`);
  };
}

// eslint-disable-next-line no-underscore-dangle
function _if(condChild, thenChild, elseChild) {
  const { info } = _if;
  const [ccArg, tcArg, ecArg] = info.argDescriptors;
  const ccExpr = ccArg.compile(condChild);
  const tcExpr = tcArg.compile(thenChild);
  const ecExpr = ecArg.compile(elseChild);
  return (scope) => {
    if (!ccExpr.resolved) {
      if (ccArg.resolve(ccExpr, scope).error) { return info.error(ccExpr.error); }
    }
    if (!tcExpr.resolved) {
      if (tcArg.resolve(tcExpr, scope).error) { return info.error(tcExpr.error); }
    }
    if (!ecExpr.resolved) {
      if (ecArg.resolve(ecExpr, scope).error) { return info.error(ecExpr.error); }
    }
    if (ecExpr.result == null) {
      return ccExpr.result(scope) ? undefined : tcExpr.result(scope);
    }
    // Either then or else is validated, never both!
    return (ccExpr.result(scope) ? ecExpr.result : tcExpr.result)(scope);
  };
}

function every(info, arg, child) {
  const [aArg, cArg] = info.argDescriptors;
  const aExpr = aArg.compile(arg);
  const cExpr = cArg.compile(child);
  return (scope) => {
    if (!aExpr.resolved) {
      if (aArg.resolve(aExpr, scope).error) { return info.error(aExpr.error); }
    }
    if (!cExpr.resolved) {
      if (cArg.resolve(cExpr, scope).error) { return info.error(cExpr.error); }
    }
    const $ = scope.find('$');
    const value = info.getValue(aExpr, scope);
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
    return info.error(`the value at path '${arg}' must be either a string, an array or an object; found type '${typeof value}'`);
  };
}

function some(info, arg, child) {
  const [aArg, cArg] = info.argDescriptors;
  const aExpr = aArg.compile(arg);
  const cExpr = cArg.compile(child);
  return (scope) => {
    if (!aExpr.resolved) {
      if (aArg.resolve(aExpr, scope).error) { return info.error(aExpr.error); }
    }
    if (!cExpr.resolved) {
      if (cArg.resolve(cExpr, scope).error) { return info.error(cExpr.error); }
    }
    const $ = scope.find('$');
    const value = info.getValue(aExpr, scope);
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
    return info.error(`the value at path '${arg}' must be either a string, an array or an object; found type '${typeof value}' instead`);
  };
}

function alter(resultOnSuccess, resultOnError, child) {
  const { info } = alter;
  const [sArg, fArg, cArg] = info.argDescriptors;
  const sExpr = sArg.compile(resultOnSuccess);
  const fExpr = fArg.compile(resultOnError);
  const cExpr = cArg.compile(child);
  return (scope) => {
    if (!sExpr.resolved) {
      if (sArg.resolve(sExpr, scope).error) { return info.error(sExpr.error); }
    }
    if (!fExpr.resolved) {
      if (fArg.resolve(fExpr, scope).error) { return info.error(fExpr.error); }
    }
    if (!cExpr.resolved) {
      if (cArg.resolve(cExpr, scope).error) { return info.error(cExpr.error); }
    }
    const r = cExpr.result(scope) === undefined ? sExpr.result : fExpr.result;
    return r == null ? undefined : r;
  };
}

function onError(result, child) {
  const { info } = onError;
  const [rArg, cArg] = info.argDescriptors;
  const rExpr = rArg.compile(result);
  const cExpr = cArg.compile(child);
  return (scope) => {
    if (!rExpr.resolved) {
      if (rArg.resolve(rExpr, scope).error) { return info.error(rExpr.error); }
    }
    if (!cExpr.resolved) {
      if (cArg.resolve(cExpr, scope).error) { return info.error(cExpr.error); }
    }
    if (cExpr.result(scope) === undefined) { return undefined; }
    return rExpr.result == null ? undefined : rExpr.result;
  };
}

// eslint-disable-next-line no-underscore-dangle
function _while(info, arg, condChild, doChild) {
  const [aArg, ccArg, dcArg] = info.argDescriptors;
  const aExpr = aArg.compile(arg);
  const ccExpr = ccArg.compile(condChild);
  const dcExpr = dcArg.compile(doChild);
  return (scope) => {
    if (!aExpr.resolved) {
      if (aArg.resolve(aExpr, scope).error) { return info.error(aExpr.error); }
    }
    if (!ccExpr.resolved) {
      if (ccArg.resolve(ccExpr, scope).error) { return info.error(ccExpr.error); }
    }
    if (!dcExpr.resolved) {
      if (dcArg.resolve(dcExpr, scope).error) { return info.error(dcExpr.error); }
    }
    const $ = scope.find('$');
    const value = info.getValue(aExpr, scope);
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
    return info.error(`the value at path '${arg}' must be either a string, an array or an object; found type '${typeof value}'`);
  };
}

function branchValidators() {
  /* eslint-disable no-unused-vars */
  const vInfo = [
    ...infoVariants$(call, 'value:any', 'child:child'),
    infoVariant(def, { def: 'scope:object', refDepth: -1 }, 'child:child'),
    infoVariant(not, 'child:child'),
    infoVariant(and, '...child:child'),
    infoVariant(or, '...child:child'),
    infoVariant(xor, '...child:child'),
    infoVariant(_if, 'cond:child', 'then:child', 'else:child?'),
    ...infoVariants$(every, 'value:any', 'child:child'),
    ...infoVariants$(some, 'value:any', 'child:child'),
    infoVariant(alter, 'resultOnSuccess:any?', 'resultOnError:any?', 'child:child'),
    infoVariant(onError, 'result:any?', 'child:child'),
    ...infoVariants$(_while, 'value:any', 'cond:child', 'do:child')
  ];
  /* eslint-enable no-unused-vars */

  const target = vInfo.reduce((acc, info) => {
    const k = info.name;
    acc[k] = info.validator; // eslint-disable-line no-param-reassign
    return acc;
  }, {});

  return target;
}

module.exports = branchValidators();
