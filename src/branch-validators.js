const { get, ensureArrayPath } = require('./util/path');
const { ensureValidator, ensureValidators, ensureScope } = require('./util/misc');
const Context = require('./util/context');
const createShortcuts = require('./util/create-shortcuts');

//
// BRANCH VALIDATORS
// They all take child validators as arguments.
//

const branchValidators = {
  call(path, childName, scope) {
    const p = ensureArrayPath(path);
    if (!childName || typeof childName !== 'string') {
      throw new Error('call: validator name must be a non empty string');
    }
    if (scope !== undefined) {
      ensureScope(scope);
    }
    return (obj, context) => {
      // eslint-disable-next-line no-param-reassign
      context = context || new Context();
      if (scope) {
        context.push(scope);
      }
      const child = context.find(childName);
      const result = child ? child(get(obj, p), context) : `call: validator with name '${childName}' not found`;
      if (scope) {
        context.pop();
      }
      return result;
    };
  },
  not(child) {
    const c = ensureValidator(child);
    return (obj, context) => (c(obj, context) ? undefined : 'not: the child validator must fail');
  },
  and(...children) {
    ensureValidators(children);
    return (obj, context) => {
      let error;
      const invalidChild = children.find((child) => {
        error = child(obj, context);
        return error;
      });
      return invalidChild ? error : undefined;
    };
  },
  or(...children) {
    ensureValidators(children);
    return (obj, context) => {
      let error;
      const validChild = children.find((child) => {
        error = child(obj, context);
        return !error;
      });
      return validChild ? undefined : error;
    };
  },
  xor(...children) {
    ensureValidators(children);
    return (obj, context) => {
      let count = 0;
      children.find((child) => {
        const error = child(obj, context);
        count += error ? 0 : 1;
        return count === 2;
      });
      return count === 1 ? undefined : `xor: expected exactly 1 valid child; found ${count} instead`;
    };
  },
  if(condChild, thenChild, elseChild) {
    if (elseChild) {
      const [cc, tc, ec] = ensureValidators([condChild, thenChild, elseChild]);
      return (obj, context) => ((cc(obj, context) ? ec : tc)(obj, context));
    }
    const [cc, tc] = ensureValidators([condChild, thenChild]);
    return (obj, context) => (cc(obj, context) ? undefined : tc(obj, context));
  },
  every(path, child) {
    const p = ensureArrayPath(path);
    const c = ensureValidator(child);
    return (obj, context) => {
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
    const p = ensureArrayPath(path);
    const c = ensureValidator(child);
    return (obj, context) => {
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
    const c = ensureValidator(child);
    return (obj, context) => (c(obj, context) ? resultOnError : resultOnSuccess);
  },
  onError(error, child) {
    const c = ensureValidator(child);
    return (obj, context) => (c(obj, context) ? error : undefined);
  },
  while(path, condChild, doChild) {
    const p = ensureArrayPath(path);
    const cc = ensureValidator(condChild);
    const dc = ensureValidator(doChild);
    return (obj, context) => {
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
createShortcuts(branchValidators, branchValidators, ['call', 'every', 'some']);

module.exports = branchValidators;
