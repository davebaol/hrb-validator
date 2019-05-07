const { get } = require('./util/path');
const Context = require('./util/context');
const createShortcuts = require('./util/create-shortcuts');
const ensureArg = require('./util/ensure-arg');

const { REF } = ensureArg;

//
// BRANCH VALIDATORS
// They all take child validators as arguments.
//

const branchValidators = {
  call(path, child) {
    let p = ensureArg.path(path);
    let c = ensureArg.validator(child);
    return (obj, context) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
      }
      if (c === REF) {
        try { c = ensureArg.validatorRef(child, context); } catch (e) { return e.message; }
      }
      return c(get(obj, p), context);
    };
  },
  def(variables, validators, child) {
    // TODO Here we're ensuring options just for convenience;
    // in fact we're ignoring variables for now.
    // eslint-disable-next-line no-unused-vars
    const vars = ensureArg.options(variables);
    const scope = ensureArg.scope(validators || {});
    let c = ensureArg.validator(child);
    return (obj, context) => {
      // eslint-disable-next-line no-param-reassign
      context = context || new Context();
      context.push(scope);
      if (c === REF) {
        try { c = ensureArg.validatorRef(child, context); } catch (e) { return e.message; }
      }
      const result = c(obj, context);
      context.pop();
      return result;
    };
  },
  not(child) {
    let c = ensureArg.validator(child);
    return (obj, context) => {
      if (c === REF) {
        try { c = ensureArg.validatorRef(child, context); } catch (e) { return e.message; }
      }
      return c(obj, context) ? undefined : 'not: the child validator must fail';
    };
  },
  and(...children) {
    const offspring = ensureArg.validators(children);
    return (obj, context) => {
      let error;
      const invalidChild = offspring.find((child, i) => {
        let c = child;
        if (c === REF) {
          try { c = ensureArg.validatorRef(children[i], context); } catch (e) { return e.message; }
          offspring[i] = c; // replace the ref with the validator
        }
        error = c(obj, context);
        return error;
      });
      return invalidChild ? error : undefined;
    };
  },
  or(...children) {
    const offspring = ensureArg.validators(children);
    return (obj, context) => {
      let error;
      const validChild = offspring.find((child, i) => {
        let c = child;
        if (c === REF) {
          try { c = ensureArg.validatorRef(children[i], context); } catch (e) { return e.message; }
          offspring[i] = c; // replace the ref with the validator
        }
        error = c(obj, context);
        return !error;
      });
      return validChild ? undefined : error;
    };
  },
  xor(...children) {
    const offspring = ensureArg.validators(children);
    return (obj, context) => {
      let count = 0;
      offspring.find((child, i) => {
        let c = child;
        if (c === REF) {
          try { c = ensureArg.validatorRef(children[i], context); } catch (e) { return e.message; }
          offspring[i] = c; // replace the ref with the validator
        }
        const error = c(obj, context);
        count += error ? 0 : 1;
        return count === 2;
      });
      return count === 1 ? undefined : `xor: expected exactly 1 valid child; found ${count} instead`;
    };
  },
  if(condChild, thenChild, elseChild) {
    if (elseChild) {
      const [cc, tc, ec] = ensureArg.validators([condChild, thenChild, elseChild]);
      return (obj, context) => ((cc(obj, context) ? ec : tc)(obj, context));
    }
    const [cc, tc] = ensureArg.validators([condChild, thenChild]);
    return (obj, context) => (cc(obj, context) ? undefined : tc(obj, context));
  },
  every(path, child) {
    let p = ensureArg.path(path);
    let c = ensureArg.validator(child);
    return (obj, context) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
      }
      if (c === REF) {
        try { c = ensureArg.validatorRef(child, context); } catch (e) { return e.message; }
      }
      const value = get(obj, p);
      if (Array.isArray(value)) {
        let error;
        const found = value.find((item, index) => {
          error = c({ index, value: item, original: obj }, context);
          return error;
        });
        return found ? error : undefined;
      }
      if (typeof value === 'object') {
        let error;
        const found = Object.keys(value).find((key, index) => {
          error = c({
            index, key, value: value[key], original: obj
          }, context);
          return error;
        });
        return found ? error : undefined;
      }
      if (typeof value === 'string') {
        let error;
        // eslint-disable-next-line no-cond-assign
        for (let index = 0, char = ''; (char = value.charAt(index)); index += 1) {
          error = c({ index, value: char, original: obj }, context);
          if (error) {
            break;
          }
        }
        return error;
      }
      return `every: the value at path '${path}' must be either a string, an array or an object; found type '${typeof value}'`;
    };
  },
  some(path, child) {
    let p = ensureArg.path(path);
    let c = ensureArg.validator(child);
    return (obj, context) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
      }
      if (c === REF) {
        try { c = ensureArg.validatorRef(child, context); } catch (e) { return e.message; }
      }
      const value = get(obj, p);
      if (Array.isArray(value)) {
        let error;
        const found = value.find((item, index) => {
          error = c({ index, value: item, original: obj }, context);
          return !error;
        });
        return found ? undefined : error;
      }
      if (typeof value === 'object') {
        let error;
        const found = Object.keys(value).find((key, index) => {
          error = c({
            index, key, value: value[key], original: obj
          }, context);
          return !error;
        });
        return found ? undefined : error;
      }
      if (typeof value === 'string') {
        let error;
        // eslint-disable-next-line no-cond-assign
        for (let index = 0, char = ''; (char = value.charAt(index)); index += 1) {
          error = c({ index, value: char, original: obj }, context);
          if (!error) {
            break;
          }
        }
        return error;
      }
      return `some: the value at path '${path}' must be either a string, an array or an object; found type '${typeof value}' instead`;
    };
  },
  alter(child, resultOnSuccess, resultOnError) {
    const c = ensureArg.validator(child);
    return (obj, context) => (c(obj, context) ? resultOnError : resultOnSuccess);
  },
  onError(error, child) {
    const c = ensureArg.validator(child);
    return (obj, context) => (c(obj, context) ? error : undefined);
  },
  while(path, condChild, doChild) {
    let p = ensureArg.path(path);
    let cc = ensureArg.validator(condChild);
    let dc = ensureArg.validator(doChild);
    return (obj, context) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
      }
      if (cc === REF) {
        try { cc = ensureArg.validatorRef(condChild, context); } catch (e) { return e.message; }
      }
      if (dc === REF) {
        try { dc = ensureArg.validatorRef(doChild, context); } catch (e) { return e.message; }
      }
      const value = get(obj, p);
      const status = { succeeded: 0, failed: 0, original: obj };
      if (Array.isArray(value)) {
        let error;
        const found = value.find((item, index) => {
          status.index = index;
          status.value = item;
          error = cc(status, context);
          if (!error) {
            status.failed += dc(status, context) ? 1 : 0;
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
          error = cc(status, context);
          if (!error) {
            status.failed += dc(status, context) ? 1 : 0;
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
          error = cc(status, context);
          if (error) {
            break;
          }
          status.failed += dc(status, context) ? 1 : 0;
          status.succeeded = index + 1 - status.failed;
        }
        return error;
      }
      return `while: the value at path '${path}' must be either a string, an array or an object; found type '${typeof value}'`;
    };
  },
};

//
// Augment with shortcut 'opt' all branch validators taking a path as first argument
//
createShortcuts(branchValidators, branchValidators, ['call', 'every', 'some', 'while']);

module.exports = branchValidators;
