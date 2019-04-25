const camelCase = require('camelcase');
const { get } = require('./path');

function optShortcutOf(validator) {
  return (path, ...args) => (obj, ctx) => (get(obj, path) ? validator(path, ...args)(obj, ctx) : undefined);
}

function addShortcutOpt(target, source, key) {
  const newKey = camelCase(`opt ${key}`);
  if (typeof source[key] !== 'function') {
    throw new Error(`Key '${key}' must be a function in order to create its opt shortcut '${newKey}'; found ${typeof obj[key]} insead`);
  }
  // eslint-disable-next-line no-param-reassign
  target[newKey] = optShortcutOf(source[key]);
  return target;
}

function createShortcuts(target, source, keys) {
  return (keys || Object.keys(source)).reduce((acc, key) => addShortcutOpt(acc, source, key), target);
};

module.exports = createShortcuts;
