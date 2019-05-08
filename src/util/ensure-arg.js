const isPlainObject = require('is-plain-object');
const V = require('..');
const { BAD_PATH, get, ensureArrayPath } = require('./path');

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

function resolveValueRef(ref, obj) {
  if (ref.$path) {
    return get(obj, ref.$path);
  }
  if (ref.$var) {
    throw new Error('Sorry, variable reference is not implemented yet.');
  }
  if (ref.$val) {
    throw new Error('Expected a value reference; found a validator reference instead.');
  }
  throw new Error('Expected value reference');
}

function resolveValidatorRef(ref, context) {
  if (ref.$val) {
    const v = context.find(ref.$val);
    if (!v) {
      throw new Error(`Unresolved validator reference to '${ref.$val}'`);
    }
    return v;
  }
  if (ref.$path || ref.$var) {
    throw new Error('Expected a validator reference; found a value reference instead.');
  }
  throw new Error('Expected validator reference');
}

function any(val) {
  return isRef(val) ? REF : val;
}

function anyRef(obj, ref) {
  const val = any(resolveValueRef(ref, obj));
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
  const val = array(resolveValueRef(ref, obj));
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
}

function integer(val) {
  if (!Number.isInteger(val)) {
    if (isRef(val)) {
      return REF;
    }
    throw new Error('Argument must be an integer number');
  }
  return val;
}

function integerRef(obj, ref) {
  const val = integer(resolveValueRef(ref, obj));
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
}

function number(val) {
  if (typeof val !== 'number') {
    if (isRef(val)) {
      return REF;
    }
    throw new Error('Argument must be a number');
  }
  return val;
}

function numberRef(obj, ref) {
  const val = number(resolveValueRef(ref, obj));
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
}

function object(val) {
  if (isRef(val)) {
    return REF;
  }
  if (val == null || typeof val !== 'object') {
    throw new Error('Argument must be an object');
  }
  return val;
}

function objectRef(obj, ref) {
  const val = object(resolveValueRef(ref, obj));
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
  const p = ensureArrayPath(val);
  if (p === BAD_PATH) {
    if (isRef(val)) {
      return REF;
    }
    throw new Error(`${validatorName}: the path must be a string, a number, an array of the two previous types, or null`);
  }
  return p;
}

function pathRef(obj, ref, validatorName) {
  const val = path(resolveValueRef(ref, obj), validatorName);
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
  const val = string(resolveValueRef(ref, obj));
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
}

function stringOrArray(val) {
  if (typeof val !== 'string' && !Array.isArray(val)) {
    if (isRef(val)) {
      return REF;
    }
    throw new Error('A type argument must be a string or an array of strings');
  }
  return val;
}

function stringOrArrayRef(obj, ref) {
  const val = stringOrArray(resolveValueRef(ref, obj));
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
}

function validator(val) {
  if (typeof val === 'function') {
    return val;
  }
  if (isPlainObject(val)) {
    const method = checkUniqueKey(val);
    if (!method) {
      throw new Error('Error: A plain object validator must have exactly one property where the key is its name and the value is the array of its arguments');
    }
    if (isRef(val)) {
      return REF;
    }
    const validate = V[method];
    if (!validate) {
      throw new Error(`Error: Unknown validator '${method}'`);
    }
    return validate(...val[method]);
  }
  throw new Error(`Expected a validator as either a function or a plain object; found a ${typeof val} instead`);
}

function validatorRef(ref, context) {
  const val = validator(resolveValidatorRef(ref, context));
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
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
  let result = vlds; // The original array is returned by default
  for (let i = 0; i < result.length; i += 1) {
    const vld = result[i];
    const v = validator(vld);
    if (v !== vld) {
      if (result === vlds) {
        // Lazy shallow copy of the original array is made only when we know
        // for sure that at least one item has to be replaced for some reason.
        // From here on we can safely update items into the copied array, which
        // of course is the one that will be returned.
        result = Array.from(vlds);
      }
      result[i] = v;
    }
  }
  return result;
}

module.exports = {
  REF,
  isRef,
  any,
  anyRef,
  array,
  arrayRef,
  integer,
  integerRef,
  number,
  numberRef,
  object,
  objectRef,
  options,
  optionsRef,
  path,
  pathRef,
  scope,
  // scopeRef,
  string,
  stringRef,
  stringOrArray,
  stringOrArrayRef,
  type: stringOrArray, // TODO: specialize this to check valid types, see util/type.js
  typeRef: stringOrArrayRef,
  validator,
  validatorRef,
  validators
  // validatorsRef
};
