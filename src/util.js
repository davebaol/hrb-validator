const camelCase = require('camelcase');
const lodashGet = require('lodash.get');
const lodashToPath = require('lodash.topath');
const V = require('.');

//
// PATHS
//

// Make sure the path is in the form of an array or undefined if empty.
// This is called during validator creation to make validation faster,
// since validation can happen multiple times ;)
function ensurePath(path, validatorName) {
  if (path == null || ((typeof path === 'string' || Array.isArray(path)) && path.length === 0)) {
    return undefined;
  }
  if (typeof path === 'string' || Array.isArray(path)) {
    return lodashToPath(path);
  }
  throw new Error(`${validatorName}: the path must be a string, an array or null`);
}

function get(obj, path) {
  return path == null ? obj : lodashGet(obj, path);
}

//
// ENSURE VALIDATORS
//

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

function ensureValidatorMap(vlds) {
  Object.keys(vlds).forEach((k) => {
    // eslint-disable-next-line no-param-reassign
    vlds[k] = ensureValidator(vlds[k]);
  });
  return vlds;
}

//
// SHORTCUT OPT
//

function shortcutOpt(f) {
  return (path, ...args) => obj => (get(obj, path) ? f(path, ...args)(obj) : undefined);
}

function addShortcutOpt(obj, key) {
  const newKey = camelCase(`opt ${key}`);
  // eslint-disable-next-line no-param-reassign
  obj[newKey] = shortcutOpt(obj[key]);
  return obj;
}

//
// CONTEXT
//

class Context {
  constructor() {
    this.stack = [];
  }

  push(scope) {
    this.stack.push(scope);
  }

  pop() {
    return this.stack.pop();
  }

  find(name) {
    for (let i = this.stack.length - 1; i >= 0; i -= 1) {
      const found = this.stack[i][name];
      if (found) {
        return found;
      }
    }
    return undefined;
  }
}

//
// EXPORTS
//

module.exports = {
  get,
  ensurePath,
  ensureValidator,
  ensureValidators,
  ensureValidatorMap,
  addShortcutOpt,
  Context
};
