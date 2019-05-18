const Argument = require('./argument');
const ensureArg = require('./ensure-arg');

const { REF } = ensureArg;

function processArgDescriptors(vName, descriptors) {
  const last = descriptors.length - 1;
  return descriptors.map((d, i) => {
    let a = d;
    if (!(a instanceof Argument)) {
      try {
        a = Argument.parse(d);
      } catch (e) {
        throw new Error(`Validator '${vName}' argument at index ${i}: ${e.message}'`);
      }
    }
    if (i < last && a.restParams) {
      throw new Error(`Validator '${vName}' argument at index ${i}: rest parameter is legal only for the last argument`);
    }
    return a;
  });
}

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
    this.argDescriptors = processArgDescriptors(this.name, argDescriptors);
  }

  ensureRestParams(args, offset = 0) {
    let ensured = args; // The original array is returned by default
    for (let i = 0; i < ensured.length; i += 1) {
      const arg = args[i];
      const ad = this.argDescriptors[this.adjustArgDescriptorIndex(i + offset)];
      const ea = ad.ensure(arg);
      if (ea !== arg) {
        if (ensured === args) {
          // Lazy shallow copy of the original array is made only when we know
          // for sure that at least one item has to be replaced for some reason.
          // From here on we can safely update items into the copied array, which
          // of course is the one that will be returned.
          ensured = args.slice();
        }
        ensured[i] = ea;
      }
    }
    return ensured;
  }

  ensureRestParamsRef(ensured, values, offset, ctx, obj) {
    for (let i = 0, len = ensured.length; i < len; i += 1) {
      if (ensured[i] === REF) {
        const ad = this.argDescriptors[this.adjustArgDescriptorIndex(i + offset)];
        // eslint-disable-next-line no-param-reassign
        ensured[i] = ad.ensureRef(values[i], ctx, obj);
      }
    }
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

  /*
   This method MUST be called before using the instance
  */
  consolidate() {
    if (!this.validator) {
      this.validator = this.link();
    }
    this.validator.info = this;
    Object.freeze(this);
  }
}

module.exports = Info;
