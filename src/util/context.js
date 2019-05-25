const { NATIVE_TYPES, UnionType } = require('./types');
const { get } = require('./path');

const VAR_NOT_FOUND = {};

class Context {
  constructor() {
    this.stack = [];
    this.types = {};
  }

  getType(name) {
    if (name in NATIVE_TYPES) {
      return NATIVE_TYPES[name];
    }

    let found = this.types[name];
    if (found) {
      return found;
    }
    const normalizedTypes = UnionType.parse(name);
    const normalizedName = UnionType.membersToString(normalizedTypes);
    if (normalizedTypes.length === 1 && normalizedName in NATIVE_TYPES) {
      this.types[name] = NATIVE_TYPES[normalizedName];
      return NATIVE_TYPES[normalizedName];
    }
    found = this.types[normalizedName];
    if (found) {
      this.types[name] = found;
      return found;
    }
    const type = new UnionType(normalizedName, normalizedTypes);
    if (name !== normalizedName) {
      this.types[name] = type;
    }
    this.types[normalizedName] = type;
    return type;
  }

  resolveValueRef(ref, obj) {
    if (ref.$path) {
      return get(obj, ref.$path);
    }
    if (ref.$var) {
      if (ref.$var.startsWith('$')) {
        throw new Error(`Expected a value reference; found validator reference to '${ref.$var}' instead.`);
      }
      const v = this.find(ref.$var);
      if (v === VAR_NOT_FOUND) {
        throw new Error(`Unresolved value reference to '${ref.$var}'`);
      }
      return v;
    }
    throw new Error('Expected value reference');
  }

  resolveValidatorRef(ref) {
    if (ref.$var) {
      if (ref.$var.startsWith('$')) {
        const v = this.find(ref.$var);
        if (v === VAR_NOT_FOUND) {
          throw new Error(`Unresolved validator reference to '${ref.$var}'`);
        }
        return v;
      }
      throw new Error(`Expected a validator reference; found value reference to '${ref.$var}' instead.`);
    }
    if (ref.$path) {
      throw new Error(`Expected a validator reference; found path reference to '${ref.$path}' instead.`);
    }
    throw new Error('Expected validator reference');
  }

  resolveRef(ref, obj) {
    if (ref.$path) {
      return get(obj, ref.$path);
    }
    if (ref.$var) {
      const v = this.find(ref.$var);
      if (v === VAR_NOT_FOUND) {
        throw new Error(`Unresolved ${ref.$var.startsWith('$') ? 'validator' : 'value'} reference to '${ref.$var}'`);
      }
      return v;
    }
    throw new Error('Expected either a value reference or a validator reference');
  }

  push(scope) {
    this.stack.push(scope);
  }

  pop() {
    return this.stack.pop();
  }

  static get VAR_NOT_FOUND() {
    return VAR_NOT_FOUND;
  }

  find(name) {
    for (let i = this.stack.length - 1; i >= 0; i -= 1) {
      if (name in this.stack[i]) {
        return this.stack[i][name]; // Found!
      }
    }
    return VAR_NOT_FOUND;
  }
}

module.exports = Context;
