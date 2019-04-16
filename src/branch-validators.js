//
// BRANCH VALIDATORS
// They all take child validators and no field as arguments.
//

module.exports = {
  not(child) {
    return m => (child(m) ? undefined : "invalid operator 'not'");
  },
  and(...children) {
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
    return (m) => {
      let c;
      const invalidChild = children.find((child) => {
        const error = child(m);
        c = error ? c : !c;
        return c === false;
      });
      return invalidChild ? "invalid operator 'xor'" : undefined;
    };
  },
  if(condChild, thenChild, elseChild) {
    return m => ((condChild(m) ? elseChild : thenChild)(m));
  },
  alter(child, resultOnSuccess, resultOnError) {
    return m => (child(m) ? resultOnError : resultOnSuccess);
  },
  onError(error, child) {
    return m => (child(m) ? error : undefined);
  }
};
