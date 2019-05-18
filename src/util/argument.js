const ensureArg = require('./ensure-arg');

// Types ammitting null as legal value, so naturally optional
const nullAllowedTypes = { path: true };

const specialRefs = {
  options: ensureArg.optionsRef,
  child: ensureArg.resolveValidatorRef
};

class Argument {
  constructor(name, type, optional, restParams, refDepth) {
    const arg = name instanceof Argument && arguments.length === 1 ? name : undefined;
    this.name = arg ? arg.name : name;
    this.type = arg ? arg.type : type;
    this.optional = arg ? arg.optional : !!optional;
    this.restParams = arg ? arg.restParams : !!restParams;
    this.refDepth = arg ? arg.refDepth : refDepth || 0;

    // Force optional for type accepting null as a good value
    if (nullAllowedTypes[type]) {
      this.optional = true;
    }

    this.resolveRef = specialRefs[type] || ensureArg.resolveValueRef;
  }

  static parseString(descriptor) {
    const p = descriptor.split(':').map(s => s.trim()); // ...name:type? where '?' means optional and '...' rest parameters
    const restParams = p[0].startsWith('...');
    const name = restParams ? p[0].substring(3).trim() : p[0];
    const optional = p[1].endsWith('?');
    const type = optional ? p[1].substring(0, p[1].length - 1).trim() : p[1];
    return new Argument(name, type, optional, restParams);
  }

  static parse(descriptor) {
    if (typeof descriptor === 'string') {
      return Argument.parseString(descriptor);
    }
    if (typeof descriptor === 'object' && 'desc' in descriptor) {
      const arg = Argument.parseString(descriptor.desc);
      if ('refDepth' in descriptor) {
        arg.refDepth = descriptor.refDepth;
      }
      return arg;
    }
    throw new Error('Invalid argument definition');
  }

  ensure(value, noReference) {
    return this.optional && value == null
      ? value : ensureArg[this.type](value, noReference || this.refDepth < 0);
  }

  ensureRef(ref, ctx, obj) {
    return this.ensure(this.resolveRef(ref, ctx, obj), true);
  }
}

module.exports = Argument;
