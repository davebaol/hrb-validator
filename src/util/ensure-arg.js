const { checkUniqueKey } = require('./misc');
const { BAD_PATH, get, ensureArrayPath2 } = require('./path');

const REF = Object.freeze({});

// const REF_KEYS = { $path: true, $var: true, $val: true };

function isRef(val) {
  // return typeof val === 'object' && typeof val.ref === 'string' && REF_KEYS[checkUniqueKey(val)];
  return typeof val === 'object' && typeof val.ref === 'string' && checkUniqueKey(val) === 'ref';
}

function resolveRef(obj, ref) {
  return get(obj, ref.ref);
}

function any(val) {
  return isRef(val) ? REF : val;
}

function anyRef(obj, ref) {
  const val = any(resolveRef(obj, ref));
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
  const val = array(resolveRef(obj, ref));
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
}

const hasOwn = Object.prototype.hasOwnProperty;

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
  const val = path(resolveRef(obj, ref), validatorName);
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
  const val = string(resolveRef(obj, ref));
  if (val === REF) {
    throw new Error('XXX: reference to another reference is not allowed');
  }
  return val;
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
  string,
  stringRef
};
