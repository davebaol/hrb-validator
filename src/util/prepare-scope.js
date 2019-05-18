const ensureArg = require('./ensure-arg');

const {
  REF, any, child, resolveValueRef
} = ensureArg;

const hasOwn = Object.prototype.hasOwnProperty;

function variable(val, ctx, obj) {
  const v = any(val);
  return v !== REF ? v : any(resolveValueRef(val, ctx, obj), true);
}

function prepareScope(objScope, ctx, obj) {
  // eslint-disable-next-line no-restricted-syntax
  for (const k in objScope) {
    if (hasOwn.call(objScope, k)) {
      // eslint-disable-next-line no-param-reassign
      objScope[k] = k.startsWith('$') ? child(objScope[k]) : variable(objScope[k], ctx, obj);
    }
  }
  return objScope;
}

module.exports = prepareScope;
