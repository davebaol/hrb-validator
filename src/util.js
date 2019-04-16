const get = require('lodash.get');

module.exports = {
  get: (obj, path) => ((typeof path === 'string' || Array.isArray(path)) && path.length > 0 ? get(obj, path) : obj)
};
