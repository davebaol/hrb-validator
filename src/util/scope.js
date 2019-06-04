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
    // eslint-disable-next-line no-restricted-syntax
    for (const k in resources) {
      if (hasOwn.call(resources, k)) {
        const cur = resources[k];
        if (typeof cur === 'object' && cur !== null) {
          const type = k.startsWith('$') ? child : any;
          const ref = type.compile(cur);
          // Notice the check (v !== cur) instead of (v instanceof Expression).
          // This way both references and compiled validators (not hard-coded ones)
          // are detected and shallow copy is triggered.
          // if (v !== cur) {
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
      // New resources are where properties are added as soon as they are resolved.
      // This way backward references are allowed, while forward referesences are not.
      this.resources = {};
      // eslint-disable-next-line no-restricted-syntax
      for (const k in compiledResources) {
        if (hasOwn.call(compiledResources, k)) {
          const cur = compiledResources[k];
          if (cur instanceof Expression) {
            const type = k.startsWith('$') ? child : any;
            const ref = type.resolve(cur, this, obj);
            if (ref.error) { throw new Error(ref.error); }
            this.resources[k] = ref.result; // eslint-disable-line no-param-reassign
          } else {
            this.resources[k] = cur; // eslint-disable-line no-param-reassign
          }
        }
      }
      this.resolved = true;
    }
  }
}

module.exports = Scope;
