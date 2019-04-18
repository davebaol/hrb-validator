const camelCase = require('camelcase');
const get = require('lodash.get');
const V = require('.');

function ensureValidator(vld) {
  if (typeof vld === 'function') {
    return vld;
  }
  if (vld.constructor !== Object) {
    throw new Error(`Expected a validator as either a function or a plain object; found a ${typeof vld} instead`);
  }
  const methods = Object.keys(vld);
  if (methods.length !== 1) {
    throw new Error('Error: A validators as a plain object must have exactly one property where the key is its name and the value is the array of its arguments');
  }
  const method = methods[0];
  const validator = V[method];
  if (!validator) {
    throw new Error(`Error: Unknown validator '${method}'`);
  }
  return validator(...vld[method]);
}

function ensureValidators(vlds) {
  vlds.forEach((vld, idx) => {
    // eslint-disable-next-line no-param-reassign
    vlds[idx] = ensureValidator(vld);
  });
  return vlds;
}

const shortcuts = {
  opt(f) {
    return (path, ...args) => obj => (get(obj, path) ? f(path, ...args)(obj) : undefined);
  },
  not(f, k) {
    return (path, ...args) => obj => (f(path, ...args)(obj) ? undefined : `the value at path '${path}' must satisfy the validator '${k}'`);
  }
};

function addShortcuts(obj, key) {
  return Object.keys(shortcuts).reduce((acc, shortcut) => {
    const newKey = camelCase(`${shortcut} ${key}`);
    acc[newKey] = shortcuts[shortcut](obj[key], newKey);
    return acc;
  }, obj);
}

module.exports = {
  get(obj, path) {
    return ((typeof path === 'string' || Array.isArray(path)) && path.length > 0 ? get(obj, path) : obj);
  },
  ensureValidator,
  ensureValidators,
  addShortcuts
};
