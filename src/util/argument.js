const { getType } = require('./types');

function retrieveType(typeDesc, context) {
  return context ? context.getType(typeDesc) : getType(typeDesc);
}

/* eslint-disable no-param-reassign */
function parseDef(target, def, context) {
  const p = def.split(':').map(s => s.trim()); // ...<name>:<type> where '...' stands for rest parameters
  target.restParams = p[0].startsWith('...');
  target.name = target.restParams ? p[0].substring(3).trim() : p[0];
  target.type = retrieveType(p[1], context);
}
/* eslint-enable no-param-reassign */

class Argument {
  constructor(desc, context) {
    if (typeof desc === 'string') {
      parseDef(this, desc, context);
    } else if (typeof desc === 'object') {
      if (desc.def) {
        parseDef(this, desc.def, context);
      } else {
        this.name = desc.name;
        this.type = typeof desc.type === 'string' ? retrieveType(desc.type, context) : desc.type;
        this.restParams = !!desc.restParams;
      }
    } else {
      throw new Error('Invalid argument definition: expected string, object or another argument.');
    }
    this.refDepth = desc.refDepth || 0;
    if (!this.name || !this.type) {
      throw new Error('Invalid argument definition: name or type are missing.');
    }
  }

  compile(value, noReference) {
    return this.type.compile(value, noReference || this.refDepth < 0);
  }

  resolve(expr, scope) {
    return this.type.resolve(expr, scope);
  }
}

module.exports = Argument;
