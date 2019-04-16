const _get = require('lodash.get');

module.exports = {
  get: (obj, path) => (typeof path === 'string' || Array.isArray(path)) && path.length > 0? _get(obj, path) : obj
};
