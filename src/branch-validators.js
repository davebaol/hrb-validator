const { get, ensureValidator, ensureValidators } = require('./util');
//
// BRANCH VALIDATORS
// They all take child validators as arguments.
//

module.exports = {
  not(child) {
    const c = ensureValidator(child);
    return m => (c(m) ? undefined : "invalid operator 'not'");
  },
  and(...children) {
    ensureValidators(children);
    return (m) => {
      let error;
      const invalidChild = children.find((child) => {
        error = child(m);
        return error;
      });
      return invalidChild ? error : undefined;
    };
  },
  or(...children) {
    ensureValidators(children);
    return (m) => {
      let error;
      const validChild = children.find((child) => {
        error = child(m);
        return !error;
      });
      return validChild ? undefined : error;
    };
  },
  xor(...children) {
    ensureValidators(children);
    return (m) => {
      let count = 0;
      const invalidChild = children.find((child) => {
        const error = child(m);
        count += error ? 0 : 1;
        return count === 2;
      });
      return invalidChild ? "invalid operator 'xor'" : undefined;
    };
  },
  if(condChild, thenChild, elseChild) {
    const [cc, tc, ec] = ensureValidators([condChild, thenChild, elseChild]);
    return m => ((cc(m) ? ec : tc)(m));
  },
  every(field, child) {
    const c = ensureValidator(child);
    return (m) => {
      const m2 = get(m, field);
      if (Array.isArray(m2)) {
        let error;
        const invalidItem = m2.find((item, index) => {
          error = c({ index, value: item, original: m });
          return error;
        });
        return invalidItem ? error : undefined;
      } if (typeof m2 === 'object') {
        let error;
        const invalidItem = Object.keys(m2).find((key, index) => {
          error = c({
            index, key, value: m2[key], original: m
          });
          return error;
        });
        return invalidItem ? error : undefined;
      }
      return `each: the field '${field}' must be either an array or an object; found type '${typeof m2}'`;
    };
  },
  some(field, child) {
    const c = ensureValidator(child);
    return (m) => {
      const m2 = get(m, field);
      if (Array.isArray(m2)) {
        let error;
        const validItem = m2.find((item, index) => {
          error = c({ index, value: item, original: m });
          return !error;
        });
        return validItem ? undefined : error;
      } if (typeof m2 === 'object') {
        let error;
        const validItem = Object.keys(m2).find((key, index) => {
          error = c({
            index, key, value: m2[key], original: m
          });
          return !error;
        });
        return validItem ? undefined : error;
      }
      return `each: the field '${field}' must be either an array or an object; found type '${typeof m2}'`;
    };
  },
  alter(child, resultOnSuccess, resultOnError) {
    const c = ensureValidator(child);
    return m => (c(m) ? resultOnError : resultOnSuccess);
  },
  onError(error, child) {
    const c = ensureValidator(child);
    return m => (c(m) ? error : undefined);
  }
};
