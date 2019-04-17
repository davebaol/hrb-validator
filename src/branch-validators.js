const { ensureValidator, ensureValidators } = require('./util');

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
  alter(child, resultOnSuccess, resultOnError) {
    const c = ensureValidator(child);
    return m => (c(m) ? resultOnError : resultOnSuccess);
  },
  onError(error, child) {
    const c = ensureValidator(child);
    return m => (c(m) ? error : undefined);
  }
};
