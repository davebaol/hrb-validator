const { getType } = require('./types');

class Argument {
  constructor(name, typeDesc, restParams, refDepth) {
    const arg = name instanceof Argument && arguments.length === 1 ? name : undefined;
    this.name = arg ? arg.name : name;
    this.type = arg ? arg.type : getType(typeDesc);
    this.restParams = arg ? arg.restParams : !!restParams;
    this.refDepth = arg ? arg.refDepth : refDepth || 0;
  }

  static parseString(descriptor) {
    const p = descriptor.split(':').map(s => s.trim()); // ...<name>:<type> where '...' stands for rest parameters
    const restParams = p[0].startsWith('...');
    const name = restParams ? p[0].substring(3).trim() : p[0];
    const type = p[1];
    return new Argument(name, type, restParams);
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
    return this.type.ensure(value, noReference || this.refDepth < 0);
  }

  ensureRef(ref, ctx, obj) {
    return this.ensure(this.type.ensureRef(ref, ctx, obj), true);
  }
}

module.exports = Argument;
