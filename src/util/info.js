const Argument = require('./argument');

class Info {
  constructor(validator, ...argDescriptors) {
    if (typeof validator === 'function') {
      if (!validator.name) {
        throw new Error('Expected non anonymous function; otherwise make sure it\'s not an issue due to minification');
      }
      this.validator = validator;
      this.name = validator.name.startsWith('_') ? validator.name.substring(1) : validator.name;
    } else if (typeof validator === 'string') {
      this.name = validator;
    } else {
      throw new Error('Expected the function or its name as first argument');
    }
    this.argDescriptors = argDescriptors; // will be processed in consolidate()
  }

  compileRestParams(args, offset = 0) {
    const exprs = [];
    for (let i = 0; i < args.length; i += 1) {
      const arg = args[i];
      const ad = this.argDescriptors[this.adjustArgDescriptorIndex(i + offset)];
      exprs[i] = ad.compile(arg);
    }
    return exprs;
  }

  // Returns the index of the first param where an error occurred; -1 otherwise
  resolveRestParams(exprs, offset, scope, obj) {
    for (let i = 0, len = exprs.length; i < len; i += 1) {
      if (!exprs[i].resolved) {
        const ad = this.argDescriptors[this.adjustArgDescriptorIndex(i + offset)];
        ad.resolve(exprs[i], scope, obj);
        if (exprs[i].error) {
          return i;
        }
      }
    }
    return -1;
  }

  // Adjust the index to take into account rest parameters
  adjustArgDescriptorIndex(index) {
    const len = this.argDescriptors.length;
    if (index >= len && this.argDescriptors[len - 1].restParams) {
      return len - 1;
    }
    return index;
  }

  /* eslint-disable-next-line class-methods-use-this */
  link() {
    /* istanbul ignore next */
    throw new Error('To support anonymous function inherited classes have to implement the method link!');
  }

  processArgDescriptors(context) {
    const last = this.argDescriptors.length - 1;
    this.argDescriptors = this.argDescriptors.map((d, i) => {
      let a;
      try {
        a = new Argument(d, context);
      } catch (e) {
        throw new Error(`Validator '${this.name}' argument at index ${i}: ${e.message}`);
      }
      if (i < last && a.restParams) {
        throw new Error(`Validator '${this.name}' argument at index ${i}: rest parameter is legal only for the last argument`);
      }
      return a;
    });
  }

  /*
   This method MUST be called before using the instance
  */
  consolidate(context) {
    this.processArgDescriptors(context);
    if (!this.validator) {
      this.validator = this.link();
    }
    this.validator.info = this;
    Object.freeze(this);
  }
}

module.exports = Info;
