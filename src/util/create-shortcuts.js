const camelCase = require('camelcase');
const { get } = require('./path');
const ensureArg = require('../util/ensure-arg');
const Info = require('../util/info');

const { REF } = ensureArg;

function optShortcutOf(validator, name) {
  const optV = (path, ...args) => {
    let p = ensureArg.path(path);
    return (obj, ctx) => {
      if (p === REF) {
        try { p = ensureArg.pathRef(path, ctx, obj); } catch (e) { return e.message; }
      }
      return (get(obj, p) ? validator(p, ...args)(obj, ctx) : undefined);
    };
  };
  Object.defineProperty(optV, 'name', { value: name, writable: false });
  return (new Info(optV, ...(validator.owner.argDescriptors.map(ad => ad.stringDesc)))).validator;
}

function addShortcutOpt(target, source, key) {
  const newKey = camelCase(`opt ${key}`);
  if (typeof source[key] !== 'function') {
    throw new Error(`Key '${key}' must be a function in order to create its opt shortcut '${newKey}'; found ${typeof source[key]} insead`);
  }
  // eslint-disable-next-line no-param-reassign
  target[newKey] = optShortcutOf(source[key], newKey);
  return target;
}

function createShortcuts(target, source, keys) {
  source = source || target; // eslint-disable-line no-param-reassign
  keys = keys || Object.keys(source); // eslint-disable-line no-param-reassign
  return keys.reduce((acc, key) => addShortcutOpt(acc, source, key), target);
}

module.exports = createShortcuts;
