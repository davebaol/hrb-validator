const isPlainObject = require('is-plain-object');
const isRegExp = require('is-regexp');
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

const ANY = ['boolean', 'number', 'object', 'string'].reduce((acc, k) => {
  acc[k] = true;
  return acc;
}, {});

function any(val, noReference) {
  if (val != null && ANY[typeof val]) {
    return !noReference && isRef(val) ? REF : val;
  }
  throw new Error('Argument has unknown type');
}

function anyRef(ref, context, obj) {
  return any(resolveValueRef(ref, context, obj), true);
}

function array(val, noReference) {
  if (!Array.isArray(val)) {
    if (!noReference && isRef(val)) {
      return REF;
    }
    throw new Error('Argument must be an array');
  }
  return val;
}

function integer(val, noReference) {
  if (!Number.isInteger(val)) {
    if (!noReference && isRef(val)) {
      return REF;
    }
    throw new Error('Argument must be an integer number');
  }
  return val;
}

function number(val, noReference) {
  if (typeof val !== 'number') {
    if (!noReference && isRef(val)) {
      return REF;
    }
    throw new Error('Argument must be a number');
  }
  return val;
}

// Contrary to options, an object can only be referenced as a whole.
// Its properties cannot be referenced individually.
function object(val, noReference) {
  if (!noReference && isRef(val)) {
    return REF;
  }
  if (!isPlainObject(val)) {
    throw new Error('Argument must be an object');
  }
  return val;
}

function objectRef(ref, context, obj) {
  return object(resolveValueRef(ref, context, obj), true);
}

// Like object, options can be referenced as a whole.
// However first level properties can be referenced individually.
function options(val, noReference) {
  if (val != null) {
    if (!noReference && isRef(val)) {
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

function path(val, noReference) {
  const p = ensureArrayPath(val);
  if (p === BAD_PATH) {
    if (!noReference && isRef(val)) {
      return REF;
    }
    throw new Error('XXX: the path must be a string, a number, an array of the two previous types, or null');
  }
  return p;
}


function string(val, noReference) {
  if (typeof val !== 'string') {
    if (!noReference && isRef(val)) {
      return REF;
    }
    throw new Error('Argument must be a string');
  }
  return val;
}

function stringOrArray(val, noReference) {
  if (typeof val !== 'string' && !Array.isArray(val)) {
    if (!noReference && isRef(val)) {
      return REF;
    }
    throw new Error('A type argument must be a string or an array of strings');
  }
  return val;
}

function stringOrRegex(val, noReference) {
  if (typeof val !== 'string' && !isRegExp(val)) {
    if (!noReference && isRef(val)) {
      return REF;
    }
    throw new Error('The argument must be a string or a regex');
  }
  return val;
}

function child(val, noReference) {
  if (typeof val === 'function') {
    return val;
  }
  if (isPlainObject(val)) {
    const method = checkUniqueKey(val);
    if (!method) {
      throw new Error('Error: A plain object validator must have exactly one property where the key is its name and the value is the array of its arguments');
    }
    if (!noReference && isRef(val)) {
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
  return child(resolveValidatorRef(ref, context), true);
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
  integer,
  number,
  object,
  objectRef,
  options,
  optionsRef,
  path,
  string,
  stringOrArray,
  stringOrRegex,
  type: stringOrArray, // TODO: specialize this to check valid types, see util/type.js
  child,
  childRef,
  children,
  // validatorsRef
  resolveValidatorRef,
  resolveValueRef
};
