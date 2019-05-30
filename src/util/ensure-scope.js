const isPlainObject = require('is-plain-object');
const { getNativeType } = require('./types');
const Reference = require('./reference');

const hasOwn = Object.prototype.hasOwnProperty;

const any = getNativeType('any');
const child = getNativeType('child');

function ensureScope(scope) {
  if (!isPlainObject(scope)) {
    throw new Error('Expected a scope of type \'object\'');
  }
  let target = scope;
  const kRef = Reference.isRef(scope);
  if (kRef) {
    throw new Error('Root reference not allowed for scopes');
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const k in scope) {
    if (hasOwn.call(scope, k)) {
      const cur = scope[k];
      if (typeof cur === 'object' && cur !== null) {
        const type = k.startsWith('$') ? child : any;
        const v = type.ensure(cur);
        // Notice the check (v !== cur) instead of (v instanceof Reference).
        // This way both references and compiled validators (not hard-coded ones)
        // are detected and shollow copy is triggered.
        if (v !== cur) {
          if (target === scope) { target = Object.assign({}, scope); } // lazy shallow copy
          target[k] = v;
        }
      }
    }
  }
  return target;
}

function ensureScopeRef(newScope, scope, context, obj) {
  // eslint-disable-next-line no-restricted-syntax
  for (const k in scope) {
    if (hasOwn.call(scope, k)) {
      const cur = scope[k];
      if (cur instanceof Reference) {
        const type = k.startsWith('$') ? child : any;
        const v = type.ensureRef(cur, context, obj);
        newScope[k] = v; // eslint-disable-line no-param-reassign
      } else {
        newScope[k] = cur; // eslint-disable-line no-param-reassign
      }
    }
  }
  return newScope;
}

module.exports = {
  ensureScope,
  ensureScopeRef
};
