const { NATIVE_TYPES, UnionType } = require('./types');

class Context {
  constructor() {
    this.types = {};
  }

  static find(scope, name, defaultValue) {
    for (let curScope = scope; curScope != null; curScope = curScope.parent) {
      if (name in curScope.resources) {
        return curScope.resources[name]; // Found in current scope
      }
    }
    return defaultValue; // Not found in any scope
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
}

module.exports = Context;
