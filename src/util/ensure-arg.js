const isPlainObject = require('is-plain-object');
const V = require('..');
const { BAD_PATH, get, ensureArrayPath2 } = require('./path');

const REF = Object.freeze({});

const REF_VALID_KEYS = {
  $path: true,
  $var: true,
  $val: true
};

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

function isRef(val) {
  return typeof val === 'object' && REF_VALID_KEYS[checkUniqueKey(val)];
}

function resolveValueRef(obj, ref) {
  if (ref.$path) {
    return get(obj, ref.$path);
  }
  if (ref.$var) {
    throw new Error('Sorry, variable reference is not implemented yet.');
  }
  if (ref.$val) {
    throw new Error('Expected a value reference; found a validator reference instead.');
  }
  throw new Error('Illegal value reference');
}

// eslint-disable-next-line no-unused-vars
function resolveValidatorRef(obj, ref) {
  if (ref.$val) {
    throw new Error('Sorry, validator reference is not implemented yet.');
  }
  if (ref.$path || ref.$var) {
    throw new Error('Expected a validator reference; found a value reference instead.');
  }
  throw new Error('Illegal validator reference');
}

function any(val) {
  return isRef(val) ? REF : val;
}

function anyRef(obj, ref) {
  const val = any(resolveValueRef(obj, ref));
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
}

function array(val) {
  if (!Array.isArray(val)) {
    if (isRef(val)) {
      return REF;
    }
    throw new Error('Argument must be an array');
  }
  return val;
}

function arrayRef(obj, ref) {
  const val = array(resolveValueRef(obj, ref));
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
}

function options(val) {
  if (val != null) {
    if (typeof val !== 'object') {
      throw new Error('optional argument \'options\' must be an object (if specified)');
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const k in val) { // Check if any of the 1st level keys is a reference
      if (hasOwn.call(val, k)) {
        if (isRef(val[k])) { return REF; }
      }
    }
  }
  return val || {};
}

function optionsRef(obj, ref) {
  const opts = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const k in ref) { // Resolve any 1st level key that is a reference
    if (hasOwn.call(ref, k)) {
      const opt = any(ref[k]);
      opts[k] = opt === REF ? anyRef(obj, ref[k]) : opt;
    }
  }
  return opts;
}

function path(val, validatorName) {
  const p = ensureArrayPath2(val);
  if (p === BAD_PATH) {
    if (isRef(val)) {
      return REF;
    }
    throw new Error(`${validatorName}: the path must be a string, a number, an array of the two previous types, or null`);
  }
  return p;
}

function pathRef(obj, ref, validatorName) {
  const val = path(resolveValueRef(obj, ref), validatorName);
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
}

function string(val) {
  if (typeof val !== 'string') {
    if (isRef(val)) {
      return REF;
    }
    throw new Error('Argument must be a string');
  }
  return val;
}

function stringRef(obj, ref) {
  const val = string(resolveValueRef(obj, ref));
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
}

function validator(vld) {
  if (typeof vld === 'function') {
    return vld;
  }
  if (isPlainObject(vld)) {
    const method = checkUniqueKey(vld);
    if (!method) {
      throw new Error('Error: A plain object validator must have exactly one property where the key is its name and the value is the array of its arguments');
    }
    const validate = V[method];
    if (!validate) {
      throw new Error(`Error: Unknown validator '${method}'`);
    }
    return validate(...vld[method]);
  }
  throw new Error(`Expected a validator as either a function or a plain object; found a ${typeof vld} instead`);
}

function scope(obj) {
  if (!isPlainObject(obj)) {
    throw new Error('The scope must be an object');
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const k in obj) {
    if (hasOwn.call(obj, k)) {
      // eslint-disable-next-line no-param-reassign
      obj[k] = validator(obj[k]);
    }
  }
  return obj;
}

function validators(vlds) {
  vlds.forEach((vld, idx) => {
    // eslint-disable-next-line no-param-reassign
    vlds[idx] = validator(vld);
  });
  return vlds;
}
module.exports = {
  REF,
  isRef,
  any,
  anyRef,
  array,
  arrayRef,
  options,
  optionsRef,
  path,
  pathRef,
  scope,
  // scopeRef,
  string,
  stringRef,
  validator,
  // validatorRef,
  validators
  // validatorsRef
};
