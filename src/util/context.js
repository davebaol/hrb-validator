const { NATIVE_TYPES, UnionType } = require('./types');

class Context {
  constructor() {
    this.stack = [];
    this.types = {};
  }

  getType(name) {
    // Search type name in native types
    if (name in NATIVE_TYPES) {
      return NATIVE_TYPES[name];
    }

    // Search type name in local cache
    let found = this.types[name];
    if (found) {
      return found;
    }

    // Cache type name locally if its normalized name is in native type
    const normalizedTypes = UnionType.parseMembers(name);
    const normalizedName = UnionType.membersToString(normalizedTypes);
    if (normalizedTypes.length === 1 && normalizedName in NATIVE_TYPES) {
      this.types[name] = NATIVE_TYPES[normalizedName];
      return NATIVE_TYPES[normalizedName];
    }

    // Cache type name locally if its normalized name is in local cache
    found = this.types[normalizedName];
    if (found) {
      this.types[name] = found;
      return found;
    }

    // Create type instance and chache both normalized name and not
    const type = new UnionType(normalizedName, normalizedTypes);
    if (name !== normalizedName) {
      this.types[name] = type;
    }
    this.types[normalizedName] = type;
    return type;
  }

  push(scope) {
    this.stack.push(scope);
  }

  pop() {
    return this.stack.pop();
  }

  find(name, defaultValue) {
    for (let i = this.stack.length - 1; i >= 0; i -= 1) {
      if (name in this.stack[i]) {
        return this.stack[i][name]; // Found!
      }
    }
    return defaultValue; // Not found!
  }
}

module.exports = Context;
