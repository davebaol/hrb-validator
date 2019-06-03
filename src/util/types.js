const isPlainObject = require('is-plain-object');
const isRegExp = require('is-regexp');
const { BAD_PATH, ensureArrayPath } = require('./path');
const Expression = require('./expression');
const { ANY_VALUE, checkUniqueKey, lazyProperty } = require('./misc');
const V = require('..');

// Primitive and union types are progressively added below
const NATIVE_TYPES = {};

function addNativeTypes(types) {
  const len = Object.keys(NATIVE_TYPES).length;
  return types.reduce((acc, t, i) => {
    acc[t.name] = t;
    if (t.score === undefined) {
      // Add index-based score
      t.score = len + i; // eslint-disable-line no-param-reassign
    }
    return acc;
  }, NATIVE_TYPES);
}

// -------------------------------------------------------
// -------------------- SIMPLE TYPES ---------------------
// -------------------------------------------------------

class Type {
  constructor(name, score) {
    this.name = name;
    this.score = score;
  }


  get nullable() {
    return lazyProperty(this, 'nullable', this.check(null));
  }

  get acceptsValue() {
    return !this.acceptsValidator;
  }

  // Only validators are executable (we're cecking for a function)
  get acceptsValidator() {
    const value = this.check(ensureArrayPath); // Let's test a randomly picked function
    return lazyProperty(this, 'acceptsValidator', value);
  }

  get swallowsRef() {
    const value = this.check({ $var: ':)' }); // Let's test an object
    return lazyProperty(this, 'swallowsRef', value);
  }

  /* eslint-disable-next-line class-methods-use-this */
  check(val) { // eslint-disable-line no-unused-vars
    return true;
  }

  ensure1(expr) {
    if (!expr.error && expr.resolved && !this.check(expr.result)) {
      return expr.setError(`Expected type '${this.name}'`);
    }
    return expr;
  }

  ensure(val, noReference) {
    const expr = new Expression(this, val, noReference ? [] : undefined);
    this.ensure1(expr);
    if (expr.error) {
      throw new Error(expr.error);
    }
    return expr;
  }

  ensureRef(expr, context, obj) {
    return this.ensure1(expr.resolve(context, obj));
  }
}

class NullType extends Type {
  constructor() {
    super('null');
  }

  /* eslint-disable-next-line class-methods-use-this */
  check(val) {
    return val == null; // undefined is considered as null
  }
}

class StringType extends Type {
  constructor() {
    super('string');
  }

  /* eslint-disable-next-line class-methods-use-this */
  check(val) {
    return typeof val === 'string';
  }
}

class BooleanType extends Type {
  constructor() {
    super('boolean');
  }

  /* eslint-disable-next-line class-methods-use-this */
  check(val) {
    return typeof val === 'boolean';
  }
}

class NumberType extends Type {
  constructor() {
    super('number');
  }

  /* eslint-disable-next-line class-methods-use-this */
  check(val) {
    return typeof val === 'number';
  }
}

class IntegerType extends Type {
  constructor() {
    super('integer');
  }

  /* eslint-disable-next-line class-methods-use-this */
  check(val) {
    return Number.isInteger(val);
  }
}

class ArrayType extends Type {
  constructor() {
    super('array');
  }

  /* eslint-disable-next-line class-methods-use-this */
  check(val) {
    return Array.isArray(val);
  }
}

class ObjectType extends Type {
  constructor() {
    super('object');
  }

  /* eslint-disable-next-line class-methods-use-this */
  check(val) {
    return isPlainObject(val);
  }
}

class RegexType extends Type {
  constructor() {
    super('regex');
  }

  /* eslint-disable-next-line class-methods-use-this */
  check(val) {
    return isRegExp(val);
  }
}

class ChildType extends Type {
  constructor() {
    super('child');
  }

  /* eslint-disable-next-line class-methods-use-this */
  check(val) {
    if (typeof val === 'function') {
      return true;
    }
    if (isPlainObject(val)) {
      const method = checkUniqueKey(val);
      return method !== undefined && V[method] !== undefined && Array.isArray(val[method]);
    }
    return false;
  }

  /* eslint-disable-next-line class-methods-use-this */
  ensure1(expr) {
    if (expr.error || !expr.resolved) {
      return expr;
    }
    const val = expr.result;
    if (typeof val === 'function') {
      return expr;
    }
    if (isPlainObject(val)) {
      const method = checkUniqueKey(val);
      if (!method) {
        return expr.setError('Error: A plain object validator must have exactly one property where the key is its name and the value is the array of its arguments');
      }
      const validate = V[method];
      if (validate) {
        expr.result = validate(...val[method]); // eslint-disable-line no-param-reassign
        return expr;
      }
      // if (method === '$path') {
      //   // Doesn't make sense taking a validator from the object to validate.
      //   // It sounds like an error. So let's prevent this from occurring.
      //   return expr.setError(`Unexpected reference '${JSON.stringify(val)}' for a validator`);
      // }
      return expr.setError(`Error: Unknown validator '${method}'`);
    }
    return expr.setError(`Expected a validator as either a function or a plain object; found a ${typeof val} instead`);
  }
}

// Add primitive Types
const primitiveTypes = [
  new NullType(),
  new StringType(),
  new IntegerType(),
  new NumberType(),
  new BooleanType(),
  new ArrayType(),
  new ObjectType(),
  new ChildType(),
  new RegexType()
];
addNativeTypes(primitiveTypes);

// -------------------------------------------------------
// --------------------- UNION TYPES ---------------------
// -------------------------------------------------------

class UnionType extends Type {
  constructor(name, members, score) {
    super(name, score);
    const named = typeof name === 'string' && (typeof members === 'string' || Array.isArray(members));
    const m = named ? members : name;
    const s = named ? score : members;
    this.members = m;
    if (!named) {
      this.name = UnionType.membersToString(this.members);
    }
    this.score = s;
  }

  static membersToString(memberTypes) {
    return memberTypes.map(m => m.name).join('|');
  }

  static parseMembers(members) {
    let m = members;
    if (typeof members === 'string') {
      m = members.split('|');
    } else if (!Array.isArray(members)) {
      throw new Error(`Expected either a '|' separated string or an array of native types; found ${members}`);
    }
    let nullable = false;
    for (let i = 0; i < m.length; i += 1) {
      const tn = m[i];
      const qmIndex = tn.lastIndexOf('?');
      if (qmIndex >= 0) {
        if (m === members) { // clone input array before changing any item
          m = Array.from(m);
        }
        m[i] = tn.substring(0, qmIndex);
        nullable = true;
      }
    }
    if (nullable) {
      m.push('null');
    }
    let out = m.map((typeName) => {
      const tn = typeName.trim();
      const t = NATIVE_TYPES[tn];
      if (t) {
        return t;
      }
      throw new Error(`Unknown native type '${tn}'`);
    });

    // TODO here we should check for ambiguous things like string|path
    // since string is also part of path and has a special treatment, see path.ensure()

    out = out.sort((a, b) => a.score - b.score)
      .filter((x, i, a) => !i || x !== a[i - 1]); // unique

    if (out.length === 0) {
      throw new Error('A union type must have at least one member');
    }
    return out;
  }

  get nullable() {
    const value = this.members.some(m => m.nullable);
    return lazyProperty(this, 'nullable', value);
  }

  get acceptsValue() {
    const value = this.members.some(m => m.acceptsValue);
    return lazyProperty(this, 'acceptsValue', value);
  }

  get acceptsValidator() {
    const value = this.members.some(m => m.acceptsValidator);
    return lazyProperty(this, 'acceptsValidator', value);
  }

  /*
  * Any type accepting an object (for instance any and object)
  * considers an unknown ref like a good value, so cannot fail on validator creation
  */
  get swallowsRef() {
    const value = this.members.some(m => m.swallowsRef);
    return lazyProperty(this, 'swallowsRef', value);
  }

  check(val) {
    for (let i = 0; i < this.members.length; i += 1) {
      if (this.members[i].check(val)) {
        return true;
      }
    }
    return false;
  }

  ensure1(expr) {
    if (expr.error || !expr.resolved) {
      return expr;
    }
    for (let i = 0; i < this.members.length; i += 1) {
      this.members[i].ensure1(expr);
      if (!expr.error) {
        return expr; // Found
      }
      expr.error = undefined; // eslint-disable-line no-param-reassign
    }
    return expr.setError(`Expected type '${this.name}'`);
  }
}

class PathType extends UnionType {
  constructor() {
    super('path', UnionType.parseMembers('string|number|array?'));
  }

  // Optimized check
  /* eslint-disable-next-line class-methods-use-this */
  check(val) {
    return val == null || typeof val === 'string' || Array.isArray(val) || typeof val === 'number';
  }

  /* eslint-disable-next-line class-methods-use-this */
  ensure1(expr) {
    if (expr.error || !expr.resolved) {
      return expr;
    }
    const p = ensureArrayPath(expr.result);
    if (p === BAD_PATH) {
      return expr.setError('Expected a path in the form of a string, a number, an array of the two previous types, or null');
    }
    expr.result = p; // eslint-disable-line no-param-reassign
    return expr;
  }
}

// Union of all native types except child, and path
class AnyType extends UnionType {
  constructor() {
    super('any', UnionType.parseMembers('null|string|integer|number|boolean|array|object|regex'));
  }

  // Optimized version: no need to check all members
  /* eslint-disable-next-line class-methods-use-this */
  check(val) {
    return ANY_VALUE[typeof val];
  }

  // Optimized version: no need to check all members
  /* eslint-disable-next-line class-methods-use-this */
  ensure1(expr) {
    if (!expr.error && expr.resolved && !this.check(expr.result)) {
      return expr.setError(`Expected type '${this.name}'`);
    }
    return expr;
  }
}

// Add union types
addNativeTypes([new PathType(), new AnyType()]);

// Freeze native types
Object.freeze(NATIVE_TYPES);

module.exports = {
  Type,
  UnionType,
  AnyType,
  ArrayType,
  BooleanType,
  ChildType,
  IntegerType,
  NullType,
  NumberType,
  ObjectType,
  PathType,
  RegexType,
  StringType,
  NATIVE_TYPES,
  getNativeType: name => NATIVE_TYPES[name],
  getType(name) {
    if (name in NATIVE_TYPES) {
      return NATIVE_TYPES[name];
    }
    // Create new type
    const normalizedTypes = UnionType.parseMembers(name);
    return normalizedTypes.length === 1 ? normalizedTypes[0] : new UnionType(normalizedTypes);
  }
};
