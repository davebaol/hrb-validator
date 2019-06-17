const isPlainObject = require('is-plain-object');
const { getNativeType } = require('./types');
const Expression = require('./expression');
const Context = require('./context');

const hasOwn = Object.prototype.hasOwnProperty;

const any = getNativeType('any');
const child = getNativeType('child');

class Scope {
  constructor(parentOrContextOr$, resources) {
    if (parentOrContextOr$ instanceof Scope) {
      // Non root scope inherits context from parent
      this.parent = parentOrContextOr$;
      this.context = this.parent.context;
    } else {
      // Root scope needs either an explicit context or the object to validate
      this.parent = undefined;
      this.context = parentOrContextOr$ instanceof Context
        ? parentOrContextOr$
        : new Context(parentOrContextOr$);
    }
    this.resources = resources || {};
    this.resolved = false;
  }

  setParent(parent) {
    this.parent = parent;
    this.context = parent ? parent.context : undefined;
  }

  find(name, defaultValue) {
    return Context.find(this, name, defaultValue);
  }

  static compile(parentOrContextOr$, resources) {
    if (!isPlainObject(resources)) {
      throw new Error('Expected a scope of type \'object\'');
    }
    let target = resources;
    const kRef = Expression.isRef(resources);
    if (kRef) {
      throw new Error('Root reference not allowed for scopes');
    }
    if ('$' in resources) {
      throw new Error('$ cannot be shadowed');
    }
    for (const k in resources) { // eslint-disable-line no-restricted-syntax
      if (hasOwn.call(resources, k)) {
        const cur = resources[k];
        if (typeof cur === 'object' && cur !== null) {
          const type = k.startsWith('$') ? child : any;
          const expr = type.compile(cur);
          // The check (ref.result !== cur) detects both
          // references and non hard-coded validators
          // to trigger shallow copy.
          if (!expr.resolved || (expr.resolved && expr.result !== cur)) {
            if (target === resources) {
              target = Object.assign({}, resources); // lazy shallow copy
            }
            target[k] = expr.resolved ? expr.result : expr;
          }
        }
      }
    }
    const scope = new Scope(parentOrContextOr$, target);
    scope.resolved = target === resources;
    return scope;
  }

  resolve() {
    if (!this.resolved) {
      const compiledResources = this.resources;
      // Set resources to a fresh new object in order to add properties progressively
      // as soon as they are resolved.
      // This way backward references are allowed, while forward references are not.
      this.resources = {};
      for (const k in compiledResources) { // eslint-disable-line no-restricted-syntax
        if (hasOwn.call(compiledResources, k)) {
          let resource = compiledResources[k];
          if (resource instanceof Expression) {
            const type = k.startsWith('$') ? child : any;
            const ref = type.resolve(resource, this);
            if (ref.error) { throw new Error(ref.error); }
            resource = ref.result;
          }
          // If the resource is a validator take advantage of javasript closure
          // to override the invocation scope with its definition scope, where
          // the validator must run
          this.resources[k] = typeof resource === 'function'
            ? () => resource(this)
            : resource;
        }
      }
      this.resolved = true;
    }
  }
}

module.exports = Scope;
