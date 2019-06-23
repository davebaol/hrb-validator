const Info = require('./util/info');
const Scope = require('./util/scope');

//
// BRANCH VALIDATORS
// They all take at least one child validator as arguments.
//

/* eslint-disable lines-between-class-members */

class Call extends Info {
  constructor() {
    super('call', 'value:any', 'child:child');
  }
  create() {
    return (arg, child) => {
      const [aArg, cArg] = this.argDescriptors;
      const aExpr = aArg.compile(arg);
      const cExpr = cArg.compile(child);
      return (scope) => {
        if (!aExpr.resolved) {
          if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
        }
        if (!cExpr.resolved) {
          if (cArg.resolve(cExpr, scope).error) { return this.error(cExpr.error); }
        }
        scope.context.push$(this.getValue(aExpr, scope));
        const result = cExpr.result(scope);
        scope.context.pop$();
        return result;
      };
    };
  }
}

class Def extends Info {
  constructor() {
    super('def', { def: 'scope:object', refDepth: -1 }, 'child:child');
  }
  create() {
    return (resources, child) => {
      // Parent scope unknown at compile time
      const childScope = Scope.compile(undefined, resources);
      const cArg = this.argDescriptors[1];
      const cExpr = cArg.compile(child);
      return (scope) => {
        if (!childScope.parent) {
          childScope.setParent(scope);
        }
        if (!childScope.resolved) { // Let's process references
          try { childScope.resolve(); } catch (e) { return this.error(e.message); }
        }
        if (!cExpr.resolved) {
          if (cArg.resolve(cExpr, childScope).error) { return this.error(cExpr.error); }
        }
        return cExpr.result(childScope);
      };
    };
  }
}

class Not extends Info {
  constructor() {
    super('not', 'child:child');
  }
  create() {
    return (child) => {
      const [cArg] = this.argDescriptors;
      const cExpr = cArg.compile(child);
      return (scope) => {
        if (!cExpr.resolved) {
          if (cArg.resolve(cExpr, scope).error) { return this.error(cExpr.error); }
        }
        return cExpr.result(scope) ? undefined : this.error('the child validator must fail');
      };
    };
  }
}

class And extends Info {
  constructor() {
    super('and', '...child:child');
  }
  create() {
    return (...children) => {
      const [cArg] = this.argDescriptors;
      const offspring = this.compileRestParams(children);
      return (scope) => {
        for (let i = 0, len = offspring.length; i < len; i += 1) {
          const cExpr = offspring[i];
          if (!cExpr.resolved) {
            if (cArg.resolve(cExpr, scope).error) { return this.error(cExpr.error); }
          }
          const error = cExpr.result(scope); // Validate child
          if (error) { return error; }
        }
        return undefined;
      };
    };
  }
}

class Or extends Info {
  constructor() {
    super('or', '...child:child');
  }
  create() {
    return (...children) => {
      const [cArg] = this.argDescriptors;
      const offspring = this.compileRestParams(children);
      return (scope) => {
        let error;
        for (let i = 0, len = offspring.length; i < len; i += 1) {
          const cExpr = offspring[i];
          if (!cExpr.resolved) {
            if (cArg.resolve(cExpr, scope).error) { return this.error(cExpr.error); }
          }
          error = cExpr.result(scope); // Validate child
          if (!error) { return undefined; }
        }
        return error;
      };
    };
  }
}

class Xor extends Info {
  constructor() {
    super('xor', '...child:child');
  }
  create() {
    return (...children) => {
      const [cArg] = this.argDescriptors;
      const offspring = this.compileRestParams(children);
      return (scope) => {
        let count = 0;
        for (let i = 0, len = offspring.length; i < len; i += 1) {
          const cExpr = offspring[i];
          if (!cExpr.resolved) {
            if (cArg.resolve(cExpr, scope).error) { return this.error(cExpr.error); }
          }
          const error = cExpr.result(scope); // Validate child
          count += error ? 0 : 1;
          if (count === 2) { break; }
        }
        return count === 1 ? undefined : this.error(`expected exactly 1 valid child; found ${count} instead`);
      };
    };
  }
}

class If extends Info {
  constructor() {
    super('if', 'cond:child', 'then:child', 'else:child?');
  }
  create() {
    return (condChild, thenChild, elseChild) => {
      const [ccArg, tcArg, ecArg] = this.argDescriptors;
      const ccExpr = ccArg.compile(condChild);
      const tcExpr = tcArg.compile(thenChild);
      const ecExpr = ecArg.compile(elseChild);
      return (scope) => {
        if (!ccExpr.resolved) {
          if (ccArg.resolve(ccExpr, scope).error) { return this.error(ccExpr.error); }
        }
        if (!tcExpr.resolved) {
          if (tcArg.resolve(tcExpr, scope).error) { return this.error(tcExpr.error); }
        }
        if (!ecExpr.resolved) {
          if (ecArg.resolve(ecExpr, scope).error) { return this.error(ecExpr.error); }
        }
        if (ecExpr.result == null) {
          return ccExpr.result(scope) ? undefined : tcExpr.result(scope);
        }
        // Either then or else is validated, never both!
        return (ccExpr.result(scope) ? ecExpr.result : tcExpr.result)(scope);
      };
    };
  }
}

class Every extends Info {
  constructor() {
    super('every', 'value:any', 'child:child');
  }
  create() {
    return (arg, child) => {
      const [aArg, cArg] = this.argDescriptors;
      const aExpr = aArg.compile(arg);
      const cExpr = cArg.compile(child);
      return (scope) => {
        if (!aExpr.resolved) {
          if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
        }
        if (!cExpr.resolved) {
          if (cArg.resolve(cExpr, scope).error) { return this.error(cExpr.error); }
        }
        const $ = scope.find('$');
        const value = this.getValue(aExpr, scope);
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
        return this.error(`the value at path '${arg}' must be either a string, an array or an object; found type '${typeof value}'`);
      };
    };
  }
}

class Some extends Info {
  constructor() {
    super('some', 'value:any', 'child:child');
  }
  create() {
    return (arg, child) => {
      const [aArg, cArg] = this.argDescriptors;
      const aExpr = aArg.compile(arg);
      const cExpr = cArg.compile(child);
      return (scope) => {
        if (!aExpr.resolved) {
          if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
        }
        if (!cExpr.resolved) {
          if (cArg.resolve(cExpr, scope).error) { return this.error(cExpr.error); }
        }
        const $ = scope.find('$');
        const value = this.getValue(aExpr, scope);
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
        return this.error(`the value at path '${arg}' must be either a string, an array or an object; found type '${typeof value}' instead`);
      };
    };
  }
}

class Alter extends Info {
  constructor() {
    super('alter', 'resultOnSuccess:any?', 'resultOnError:any?', 'child:child');
  }
  create() {
    return (resultOnSuccess, resultOnError, child) => {
      const [sArg, fArg, cArg] = this.argDescriptors;
      const sExpr = sArg.compile(resultOnSuccess);
      const fExpr = fArg.compile(resultOnError);
      const cExpr = cArg.compile(child);
      return (scope) => {
        if (!sExpr.resolved) {
          if (sArg.resolve(sExpr, scope).error) { return this.error(sExpr.error); }
        }
        if (!fExpr.resolved) {
          if (fArg.resolve(fExpr, scope).error) { return this.error(fExpr.error); }
        }
        if (!cExpr.resolved) {
          if (cArg.resolve(cExpr, scope).error) { return this.error(cExpr.error); }
        }
        const r = cExpr.result(scope) === undefined ? sExpr.result : fExpr.result;
        return r == null ? undefined : r;
      };
    };
  }
}

class OnError extends Info {
  constructor() {
    super('onError', 'result:any?', 'child:child');
  }
  create() {
    return (result, child) => {
      const [rArg, cArg] = this.argDescriptors;
      const rExpr = rArg.compile(result);
      const cExpr = cArg.compile(child);
      return (scope) => {
        if (!rExpr.resolved) {
          if (rArg.resolve(rExpr, scope).error) { return this.error(rExpr.error); }
        }
        if (!cExpr.resolved) {
          if (cArg.resolve(cExpr, scope).error) { return this.error(cExpr.error); }
        }
        if (cExpr.result(scope) === undefined) { return undefined; }
        return rExpr.result == null ? undefined : rExpr.result;
      };
    };
  }
}

class While extends Info {
  constructor() {
    super('while', 'value:any', 'cond:child', 'do:child');
  }
  create() {
    return (arg, condChild, doChild) => {
      const [aArg, ccArg, dcArg] = this.argDescriptors;
      const aExpr = aArg.compile(arg);
      const ccExpr = ccArg.compile(condChild);
      const dcExpr = dcArg.compile(doChild);
      return (scope) => {
        if (!aExpr.resolved) {
          if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
        }
        if (!ccExpr.resolved) {
          if (ccArg.resolve(ccExpr, scope).error) { return this.error(ccExpr.error); }
        }
        if (!dcExpr.resolved) {
          if (dcArg.resolve(dcExpr, scope).error) { return this.error(dcExpr.error); }
        }
        const $ = scope.find('$');
        const value = this.getValue(aExpr, scope);
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
        return this.error(`the value at path '${arg}' must be either a string, an array or an object; found type '${typeof value}'`);
      };
    };
  }
}

function branchValidators() {
  const vInfo = [
    ...Info.variants(Call),
    new Def().prepare(),
    new Not().prepare(),
    new And().prepare(),
    new Or().prepare(),
    new Xor().prepare(),
    new If().prepare(),
    ...Info.variants(Every),
    ...Info.variants(Some),
    new Alter().prepare(),
    new OnError().prepare(),
    ...Info.variants(While)
  ];

  const target = vInfo.reduce((acc, info) => {
    const k = info.name;
    acc[k] = info.validator; // eslint-disable-line no-param-reassign
    return acc;
  }, {});

  return target;
}

module.exports = branchValidators();
