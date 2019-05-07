const getValue = require('get-value');

const BAD_PATH = Object.freeze({});

const getValueOptions = {
  default: undefined,
  separator: '.',
  joinChar: '.'
};

module.exports = {
  BAD_PATH,

  get(obj, path) {
    const noPath = path == null || (path.length === 0 && (typeof path === 'string' || Array.isArray(path)));
    return noPath ? obj : getValue(obj, path, getValueOptions);
  },

  ensureStringPath(path) {
    path.join('.');
  },

  // Make sure the path is in the form of an array or undefined if empty.
  // This is called during validator creation to make validation faster,
  // since validation can happen multiple times ;)
  ensureArrayPath(path /* , validatorName */) {
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
    return Array.isArray(path) ? path : BAD_PATH;
  }
};
