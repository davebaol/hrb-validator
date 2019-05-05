const isPlainObject = require('is-plain-object');
const V = require('..');

const hasOwn = Object.prototype.hasOwnProperty;

// This is an optimized version of the following code
//   let keys = Object.keys(obj);
//   return keys.length === 1 ? keys[0] : undefined;
function checkUniqueKey(obj) {
  let k0;
  // eslint-disable-next-line no-restricted-syntax
  for (const k in obj) {
    if (hasOwn.call(obj, k)) {
      if (k0 !== undefined) {
        return undefined;
      }
      k0 = k;
    }
  }
  return k0;
}

function ensureValidator(vld) {
  if (typeof vld === 'function') {
    return vld;
  }
  if (isPlainObject(vld)) {
    const method = checkUniqueKey(vld);
    if (!method) {
      throw new Error('Error: A plain object validator must have exactly one property where the key is its name and the value is the array of its arguments');
    }
    const validator = V[method];
    if (!validator) {
      throw new Error(`Error: Unknown validator '${method}'`);
    }
    return validator(...vld[method]);
  }
  throw new Error(`Expected a validator as either a function or a plain object; found a ${typeof vld} instead`);
}

function ensureValidators(vlds) {
  vlds.forEach((vld, idx) => {
    // eslint-disable-next-line no-param-reassign
    vlds[idx] = ensureValidator(vld);
  });
  return vlds;
}

function ensureScope(scope) {
  if (!isPlainObject(scope)) {
    throw new Error('The scope must be an object');
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const k in scope) {
    if (hasOwn.call(scope, k)) {
      // eslint-disable-next-line no-param-reassign
      scope[k] = ensureValidator(scope[k]);
    }
  }
  return scope;
}

module.exports = {
  checkUniqueKey,
  ensureValidator,
  ensureValidators,
  ensureScope
};
