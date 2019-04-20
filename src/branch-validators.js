const {
  get, ensureValidator, ensureValidators, addShortcutOpt
} = require('./util');

//
// BRANCH VALIDATORS
// They all take child validators as arguments.
//

const branchValidators = {
  not(child) {
    const c = ensureValidator(child);
    return obj => (c(obj) ? undefined : 'not: the child validator must fail');
  },
  and(...children) {
    ensureValidators(children);
    return (obj) => {
      let error;
      const invalidChild = children.find((child) => {
        error = child(obj);
        return error;
      });
      return invalidChild ? error : undefined;
    };
  },
  or(...children) {
    ensureValidators(children);
    return (obj) => {
      let error;
      const validChild = children.find((child) => {
        error = child(obj);
        return !error;
      });
      return validChild ? undefined : error;
    };
  },
  xor(...children) {
    ensureValidators(children);
    return (obj) => {
      let count = 0;
      const invalidChild = children.find((child) => {
        const error = child(obj);
        count += error ? 0 : 1;
        return count === 2;
      });
      return invalidChild ? "invalid operator 'xor'" : undefined;
    };
  },
  if(condChild, thenChild, elseChild) {
    if (elseChild) {
      const [cc, tc, ec] = ensureValidators([condChild, thenChild, elseChild]);
      return (obj) => ((cc(obj) ? ec : tc)(obj));
    }
    const [cc, tc] = ensureValidators([condChild, thenChild]);
    return (obj) => (cc(obj) ? undefined : tc(obj));
  },
  every(path, child) {
    const c = ensureValidator(child);
    return (obj) => {
      const obj2 = get(obj, path);
      if (Array.isArray(obj2)) {
        let error;
        const invalidItem = obj2.find((item, index) => {
          error = c({ index, value: item, original: obj });
          return error;
        });
        return invalidItem ? error : undefined;
      } if (typeof obj2 === 'object') {
        let error;
        const invalidItem = Object.keys(obj2).find((key, index) => {
          error = c({
            index, key, value: obj2[key], original: obj
          });
          return error;
        });
        return invalidItem ? error : undefined;
      }
      return `each: the value at path '${path}' must be either an array or an object; found type '${typeof obj2}'`;
    };
  },
  some(path, child) {
    const c = ensureValidator(child);
    return (obj) => {
      const obj2 = get(obj, path);
      if (Array.isArray(obj2)) {
        let error;
        const validItem = obj2.find((item, index) => {
          error = c({ index, value: item, original: obj });
          return !error;
        });
        return validItem ? undefined : error;
      } if (typeof obj2 === 'object') {
        let error;
        const validItem = Object.keys(obj2).find((key, index) => {
          error = c({
            index, key, value: obj2[key], original: obj
          });
          return !error;
        });
        return validItem ? undefined : error;
      }
      return `some: the value at path '${path}' must be either an array or an object; found type '${typeof obj2}'`;
    };
  },
  alter(child, resultOnSuccess, resultOnError) {
    const c = ensureValidator(child);
    return obj => (c(obj) ? resultOnError : resultOnSuccess);
  },
  onError(error, child) {
    const c = ensureValidator(child);
    return obj => (c(obj) ? error : undefined);
  }
};

//
// Augment with shortcuts 'opt' and 'not' all branch validators taking a path as first argument
//
['every', 'some'].reduce((acc, key) => addShortcutOpt(acc, key), branchValidators);

module.exports = branchValidators;
