const isPlainObject = require('is-plain-object');
const { getNativeType } = require('./types');
const Expression = require('./expression');

const hasOwn = Object.prototype.hasOwnProperty;

const any = getNativeType('any');
const child = getNativeType('child');

function ensureScope(scope) {
  if (!isPlainObject(scope)) {
    throw new Error('Expected a scope of type \'object\'');
  }
  let target = scope;
  const kRef = Expression.isRef(scope);
  if (kRef) {
    throw new Error('Root reference not allowed for scopes');
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const k in scope) {
    if (hasOwn.call(scope, k)) {
      const cur = scope[k];
      if (typeof cur === 'object' && cur !== null) {
        const type = k.startsWith('$') ? child : any;
        const ref = type.ensure(cur);
        // Notice the check (v !== cur) instead of (v instanceof Expression).
        // This way both references and compiled validators (not hard-coded ones)
        // are detected and shallow copy is triggered.
        // if (v !== cur) {
        if (!ref.resolved || (ref.resolved && ref.result !== cur)) {
          if (target === scope) { target = Object.assign({}, scope); } // lazy shallow copy
          target[k] = ref.resolved ? ref.result : ref;
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
      if (cur instanceof Expression) {
        const type = k.startsWith('$') ? child : any;
        const ref = type.ensureRef(cur, context, obj);
        if (ref.error) { throw new Error(ref.error); }
        newScope[k] = ref.result; // eslint-disable-line no-param-reassign
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
