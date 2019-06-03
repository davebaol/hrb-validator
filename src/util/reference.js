const clone = require('rfdc')({ proto: false, circles: false });
const { get, set, ensureArrayPath } = require('./path');
const { checkUniqueKey, ANY_VALUE } = require('./misc');

const REF_VALID_KEYS = {
  $path: true,
  $var: true
};

function createRefPath(type, tPath, key, value) {
  const targetPath = ensureArrayPath(tPath);
  if (key === '$path') {
    return { targetPath, path: ensureArrayPath(value) }; // no varName
  }
  // Split value in varName and path
  const index = value.indexOf('.');
  const varName = index < 0 ? value : value.substr(0, index);
  const path = index < 0 ? '' : value.substr(index + 1);
  if (type) {
    const isValidator = varName.startsWith('$');
    if (isValidator) {
      if (!type.acceptsValidator) {
        throw new Error(`Unexpected reference '{"${key}": "${value}"}'. Validator reference non allowed here.`);
      }
      if (path) {
        throw new Error(`Illegal validator reference '{"${key}": "${value}"}'. Deep path not allowed for a validator reference`);
      }
    } else if (!type.acceptsValue) {
      throw new Error(`Unexpected reference '{"${key}": "${value}"}'. Value reference non allowed here.`);
    }
  }
  return { targetPath, varName, path: ensureArrayPath(path) };
}

function prepareRefPaths(type, o, refPaths, path) {
  if (typeof o !== 'object' || o === null) return refPaths;
  let theRefPaths = refPaths;
  const kRef = Reference.isRef(o); // eslint-disable-line no-use-before-define
  if (kRef) {
    if (theRefPaths === undefined) {
      theRefPaths = [];
    }
    theRefPaths.push(createRefPath(type, path, kRef, o[kRef]));
    return theRefPaths;
  }
  if (type && type.acceptsValidator) {
    // Embedded reference in child's arguments are
    // processed directly by the child
    return theRefPaths;
  }
  // eslint-disable-next-line guard-for-in, no-restricted-syntax
  for (const k in o) {
    const cur = o[k];
    if (typeof cur === 'object' && cur !== null) {
      // Notice that here we're passing the type as undefined because the specific
      // type is meaningful only for the root reference, but not for embedded
      // references which are implicitly of type 'any'
      theRefPaths = prepareRefPaths(undefined, cur, theRefPaths, path === undefined ? k : `${path}.${k}`);
    }
  }
  return theRefPaths;
}

const VAR_NOT_FOUND = {};

// Any error is reported to the reference by setting its error property
function resolveRefPathAt(reference, index, context, obj) {
  const rp = reference.refPaths[index];
  if (rp.varName === undefined) {
    // Return the value at the referenced path in the input object
    return get(obj, rp.path);
  }
  // Retrieve the referenced variable/validator
  const isValidator = rp.varName.startsWith('$');
  const value = context.find(rp.varName, VAR_NOT_FOUND);
  if (value === VAR_NOT_FOUND) {
    reference.setError(`Unresolved ${isValidator ? 'validator' : 'value'} reference to '${rp.varName}'`);
    return undefined;
  }
  // Return either the validator or the value at the referenced path in the variable
  return isValidator ? value : get(value, rp.path);
}

class Reference {
  constructor(type, source, refPaths) {
    this.type = type;
    this.source = source;
    this.refPaths = refPaths || prepareRefPaths(type, source);
    this.error = undefined;
    this.resolved = this.refPaths == null || this.refPaths.length === 0;
    this.isRootRef = !this.resolved && this.refPaths.length === 1
      && this.refPaths[0].targetPath === undefined;
    // In case of any embedded reference clone the source object into the value,
    // which is where references will be replaced with their actual value
    this.result = this.resolved || this.isRootRef ? source : clone(source);
  }

  static isRef(val) {
    if (typeof val !== 'object' || val === null) {
      return undefined;
    }
    const k = checkUniqueKey(val);
    return REF_VALID_KEYS[k] ? k : undefined;
  }

  static prepareRefPaths(type, source) {
    return prepareRefPaths(type, source);
  }

  resolve(context, obj) {
    if (this.error || this.resolved) {
      return this;
    }

    if (this.isRootRef) {
      // Resolve root reference
      this.result = resolveRefPathAt(this, 0, context, obj);
    } else {
      // Resolve embedded references
      const { result: value, refPaths } = this;
      for (let i = 0, len = refPaths.length; i < len; i += 1) {
        const rpValue = resolveRefPathAt(this, i, context, obj);
        if (this.error) {
          break;
        }
        if (!ANY_VALUE[typeof rpValue]) {
          this.error = `Expected a value; found ${typeof rpValue} instead.`;
          break;
        }
        set(value, refPaths[i].targetPath, rpValue);
      }
    }

    // Set to resolve if no error
    this.resolved = !this.error;

    return this;
  }

  setError(error) {
    this.error = error;
    return this;
  }
}

module.exports = Reference;
