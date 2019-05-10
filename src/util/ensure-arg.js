const isPlainObject = require('is-plain-object');
const V = require('..');
const Context = require('./context');
const { BAD_PATH, get, ensureArrayPath } = require('./path');

const REF = Object.freeze({});

const REF_VALID_KEYS = {
  $path: true,
  $var: true
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

function resolveValueRef(ref, context, obj) {
  if (ref.$path) {
    return get(obj, ref.$path);
  }
  if (ref.$var) {
    if (ref.$var.startsWith('$')) {
      throw new Error(`Expected a value reference; found validator reference to '${ref.$var}' instead.`);
    }
    const v = context.find(ref.$var);
    if (v === Context.VAR_NOT_FOUND) {
      throw new Error(`Unresolved value reference to '${ref.$var}'`);
    }
    return v;
  }
  throw new Error('Expected value reference');
}

function resolveValidatorRef(ref, context) {
  if (ref.$var) {
    if (ref.$var.startsWith('$')) {
      const v = context.find(ref.$var);
      if (v === Context.VAR_NOT_FOUND) {
        throw new Error(`Unresolved validator reference to '${ref.$var}'`);
      }
      return v;
    }
    throw new Error(`Expected a validator reference; found value reference to '${ref.$var}' instead.`);
  }
  if (ref.$path) {
    throw new Error(`Expected a validator reference; found path reference to '${ref.$path}' instead.`);
  }
  throw new Error('Expected validator reference');
}

const ANY = ['boolean', 'number', 'object', 'string', 'undefined'].reduce((acc, k) => {
  acc[k] = true;
  return acc;
}, {});

function any(val) {
  if (ANY[typeof val]) {
    return isRef(val) ? REF : val;
  }
  throw new Error('Argument has unknown type');
}

function anyRef(ref, context, obj) {
  const val = any(resolveValueRef(ref, context, obj));
  if (val === REF) {
    throw new Error('XXX: chained references are not allowed');
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

function arrayRef(ref, context, obj) {
  const val = array(resolveValueRef(ref, context, obj));
  if (val === REF) {
    throw new Error('XXX: chained references are not allowed');
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

function integerRef(ref, context, obj) {
  const val = integer(resolveValueRef(ref, context, obj));
  if (val === REF) {
    throw new Error('XXX: chained references are not allowed');
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

function numberRef(ref, context, obj) {
  const val = number(resolveValueRef(ref, context, obj));
  if (val === REF) {
    throw new Error('XXX: chained references are not allowed');
  }
  return val;
}

// Contrary to options, an object can only be referenced as a whole.
// Its properties cannot be referenced individually.
function object(val) {
  if (isRef(val)) {
    return REF;
  }
  if (val == null || typeof val !== 'object') {
    throw new Error('Argument must be an object');
  }
  return val;
}

function objectRef(ref, context, obj) {
  const val = object(resolveValueRef(ref, context, obj));
  if (val === REF) {
    throw new Error('XXX: chained references are not allowed');
  }
  return val;
}

// Like object, options can be referenced as a whole.
// However first level properties can be referenced individually.
function options(val) {
  if (val != null) {
    if (isRef(val)) {
      return REF;
    }
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

function optionsRef(ref, context, obj) {
  if (isRef(ref)) {
    const val = options(resolveValueRef(ref, context, obj));
    if (val === REF) {
      throw new Error('XXX: chained references are not allowed');
    }
    return val;
  }
  // There must be at least one 1st level key that's a reference to resolve
  let opts = ref;
  // eslint-disable-next-line no-restricted-syntax
  for (const k in ref) {
    if (hasOwn.call(ref, k)) {
      const opt = any(ref[k]);
      if (opt === REF) {
        if (opts === ref) {
          // Lazy shallow copy of the original object is made only when we know
          // for sure that at least one property has to be replaced for some reason.
          // From here on we can safely update items into the copied object, which
          // of course is the one that will be returned.
          opts = Object.assign({}, ref);
        }
        opts[k] = anyRef(ref[k], context, obj);
      }
    }
  }
  if (opts === ref) {
    // No 1st level key is a reference
    throw new Error('Expected value reference');
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

function pathRef(ref, context, obj, validatorName) {
  const val = path(resolveValueRef(ref, context, obj), validatorName);
  if (val === REF) {
    throw new Error('XXX: chained references are not allowed');
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

function stringRef(ref, context, obj) {
  const val = string(resolveValueRef(ref, context, obj));
  if (val === REF) {
    throw new Error('XXX: chained references are not allowed');
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

function stringOrArrayRef(ref, context, obj) {
  const val = stringOrArray(resolveValueRef(ref, context, obj));
  if (val === REF) {
    throw new Error('XXX: chained references are not allowed');
  }
  return val;
}

function child(val) {
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

function childRef(ref, context) {
  const val = child(resolveValidatorRef(ref, context));
  if (val === REF) {
    throw new Error('XXX: chained references are not allowed');
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
      obj[k] = k.startsWith('$') ? child(obj[k]) : any(obj[k]);
    }
  }
  return obj;
}

function children(vlds) {
  let result = vlds; // The original array is returned by default
  for (let i = 0; i < result.length; i += 1) {
    const vld = result[i];
    const v = child(vld);
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
  child,
  childRef,
  children
  // validatorsRef
};

module.exports.kinds = Object.keys(module.exports).filter(k => typeof module.exports[k] === 'function' && typeof module.exports[`${k}Ref`] === 'function');
