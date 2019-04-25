const getValue = require('get-value');

const getValueOptions = {
  default: undefined,
  separator: '.',
  joinChar: '.'
};

module.exports = {
  get(obj, path) {
    return path == null ? obj : getValue(obj, path, getValueOptions);
  },

  ensureStringPath(path) {
    path.join('.');
  },

  // Make sure the path is in the form of an array or undefined if empty.
  // This is called during validator creation to make validation faster,
  // since validation can happen multiple times ;)
  ensureArrayPath(path, validatorName) {
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
};
