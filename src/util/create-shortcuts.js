const camelCase = require('camelcase');
const { get } = require('./path');
const Info = require('./info');
const Argument = require('./argument');
const Context = require('./context');

function getFirstArgType(validator) {
  const ads = validator.info.argDescriptors;
  return ads.length > 0 ? ads[0].type : undefined;
}

function optShortcutOf(validator, name) {
  let info;
  const optV = (path, ...args) => {
    const argDescriptor0 = info.argDescriptors[0];
    const pExpr = argDescriptor0.ensure(path);
    return (obj, ctx = new Context()) => {
      if (!pExpr.resolved) {
        argDescriptor0.ensureRef(pExpr, ctx, obj);
        if (pExpr.error) { return pExpr.error; }
      }
      return (get(obj, pExpr.result) ? validator(pExpr.result, ...args)(obj, ctx) : undefined);
    };
  };
  Object.defineProperty(optV, 'name', { value: name, writable: false });
  info = new Info(optV, ...(validator.info.argDescriptors.map(ad => new Argument(ad))));
  info.consolidate();
  return info.validator;
}

function addShortcutOpt(target, source, key) {
  const newKey = camelCase(`opt ${key}`);
  if (typeof source[key] !== 'function' || !source[key].info) {
    throw new Error(`Key '${key}' must be a validator function in order to create its opt shortcut '${newKey}'; found ${typeof source[key]} insead`);
  }
  const firstArgType = getFirstArgType(source[key]);
  if (firstArgType.name !== 'path') {
    throw new Error(`Validator '${key}' must take a path as first argument in order to create its opt shortcut '${newKey}'; found '${firstArgType}' insead`);
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
