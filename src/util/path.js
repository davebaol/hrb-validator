const getValue = require('get-value');
const setValue = require('set-value');

const BAD_PATH = Object.freeze({});

const getValueOptions = {
  default: undefined,
  separator: '.',
  joinChar: '.'
};

module.exports = {
  BAD_PATH,

  get(target, path) {
    const noPath = path == null || (path.length === 0 && (typeof path === 'string' || Array.isArray(path)));
    return noPath ? target : getValue(target, path, getValueOptions);
  },

  set(target, path, value) {
    const noPath = path == null || (path.length === 0 && (typeof path === 'string' || Array.isArray(path)));
    return noPath ? target : setValue(target, path, value);
  },

  ensureStringPath(path) {
    return path.join('.');
  },

  // Make sure the path is in the form of an array or undefined if empty.
  // This is called during validator creation to make validation faster,
  // since validation can happen multiple times ;)
  ensureArrayPath(path) {
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
