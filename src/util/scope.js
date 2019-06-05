const isPlainObject = require('is-plain-object');
const { getNativeType } = require('./types');
const Expression = require('./expression');
const Context = require('./context');

const hasOwn = Object.prototype.hasOwnProperty;

const any = getNativeType('any');
const child = getNativeType('child');

class Scope {
  constructor(parent, resources) {
    this.parent = parent;
    this.context = parent ? parent.context : new Context();
    this.resources = resources || {};
    this.resolved = false;
  }

  setParent(parent) {
    this.parent = parent;
    this.context = parent ? parent.context : new Context();
  }

  find(name, defaultValue) {
    if (name in this.resources) {
      return this.resources[name]; // Found in this scope
    }
    if (this.parent) {
      return this.parent.find(name, defaultValue); // Search parent scope
    }
    return defaultValue; // Not found in any scope
  }

  static compile(resources) {
    if (!isPlainObject(resources)) {
      throw new Error('Expected a scope of type \'object\'');
    }
    let target = resources;
    const kRef = Expression.isRef(resources);
    if (kRef) {
      throw new Error('Root reference not allowed for scopes');
    }
    for (const k in resources) { // eslint-disable-line no-restricted-syntax
      if (hasOwn.call(resources, k)) {
        const cur = resources[k];
        if (typeof cur === 'object' && cur !== null) {
          const type = k.startsWith('$') ? child : any;
          const ref = type.compile(cur);
          // Notice the check (ref.result !== cur) to detect both
          // references and compiled validators (not hard-coded ones)
          // and trigger shallow copy.
          if (!ref.resolved || (ref.resolved && ref.result !== cur)) {
            if (target === resources) {
              target = Object.assign({}, resources); // lazy shallow copy
            }
            target[k] = ref.resolved ? ref.result : ref;
          }
        }
      }
    }
    const scope = new Scope(null, target);
    scope.resolved = target === resources;
    return scope;
  }

  resolve(obj) {
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
            const ref = type.resolve(resource, this, obj);
            if (ref.error) { throw new Error(ref.error); }
            resource = ref.result;
          }
          // If the resource is a validator take advantage of javasript closure
          // to override the invocation scope with its definition scope, where
          // the validator must run
          this.resources[k] = typeof resource === 'function'
            ? object => resource(object, this)
            : resource;
        }
      }
      this.resolved = true;
    }
  }
}

module.exports = Scope;