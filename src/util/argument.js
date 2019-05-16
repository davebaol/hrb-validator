const ensureArg = require('./ensure-arg');

// Types ammitting null as legal value, so naturally optional
const nullAllowedTypes = { path: true };

const specialRefs = {
  options: ensureArg.optionsRef,
  child: ensureArg.resolveValidatorRef
};

class Argument {
  constructor(name, type, optional, restParams) {
    const arg = name instanceof Argument && arguments.length === 1 ? name : undefined;
    this.name = arg ? arg.name : name;
    this.type = arg ? arg.type : type;
    this.optional = arg ? arg.optional : optional;
    this.restParams = arg ? arg.restParams : restParams;

    // Force optional for type accepting null as a good value
    if (nullAllowedTypes[type]) {
      this.optional = true;
    }

    this.resolveRef = specialRefs[type] || ensureArg.resolveValueRef;
  }

  static parse(descriptor) {
    const p = descriptor.split(':').map(s => s.trim()); // ...name:type? where '?' means optional and '...' rest parameters
    const restParams = p[0].startsWith('...');
    const name = restParams ? p[0].substring(3).trim() : p[0];
    const optional = p[1].endsWith('?');
    const type = optional ? p[1].substring(0, p[1].length - 1).trim() : p[1];
    return new Argument(name, type, optional, restParams);
  }

  ensure(value, noReference) {
    return this.optional && value == null ? value : ensureArg[this.type](value, noReference);
  }

  ensureRef(ref, ctx, obj) {
    return this.ensure(this.resolveRef(ref, ctx, obj), true);
  }
}

module.exports = Argument;
