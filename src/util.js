const camelCase = require('camelcase');
const getValue = require('get-value');
const isPlainObject = require('is-plain-object');
const V = require('.');

//
// PATHS
//

// Make sure the path is in the form of an array or undefined if empty.
// This is called during validator creation to make validation faster,
// since validation can happen multiple times ;)
function ensureArrayPath(path, validatorName) {
  const typeOfPath = typeof path;
  if (path == null || (path.length === 0 && (typeOfPath === 'string' || Array.isArray(path)))) {
    return undefined;
  }
  if (typeOfPath === 'string') {
    return path.split('.');
  }
  if (typeOfPath === 'number') {
    return String(path).split('.');
  }
  if (Array.isArray(path)) {
    return path;
  }
  throw new Error(`${validatorName}: the path must be a string, an array, a number or null`);
}

function ensureStringPath(path) {
  path.join('.');
}

const getValueOptions = {
  default: undefined,
  separator: '.',
  joinChar: '.'
};

function get(obj, path) {
  return path == null ? obj : getValue(obj, path, getValueOptions);
}

//
// ENSURE VALIDATORS
//

const hasOwn = Object.prototype.hasOwnProperty;

// This is an optimized version of the following code
//   let keys = Object.keys(obj);
//   return keys.length === 1 ? keys[0] : undefined;
function checkUniqueKey(obj) {
  let k1;
  // eslint-disable-next-line no-restricted-syntax
  for (const k in obj) {
    if (hasOwn.call(obj, k)) {
      if (k1 !== undefined) {
        return undefined;
      }
      k1 = k;
    }
  }
  return k1;
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
  if (typeof scope !== 'object') {
    throw new Error('The scope must be an object');
  }
  Object.keys(scope).forEach((k) => {
    // eslint-disable-next-line no-param-reassign
    scope[k] = ensureValidator(scope[k]);
  });
  return scope;
}

//
// SHORTCUT OPT
//

function shortcutOpt(f) {
  return (path, ...args) => (obj, ctx) => (get(obj, path) ? f(path, ...args)(obj, ctx) : undefined);
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
  ensureArrayPath,
  ensureStringPath,
  ensureValidator,
  ensureValidators,
  ensureScope,
  addShortcutOpt,
  Context
};
