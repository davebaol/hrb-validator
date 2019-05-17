const Argument = require('./argument');

function processArgDescriptors(vName, descriptors) {
  const last = descriptors.length - 1;
  return descriptors.map((d, i) => {
    let a = d;
    if (typeof d === 'string') {
      a = Argument.parse(d);
    } else if (!(a instanceof Argument)) {
      throw new Error(`The argumentDescriptor[${i}] of validator '${vName}' is neither a string or an instance of Argument; found '${typeof d}'`);
    }
    if (i < last && a.restParams) {
      throw new Error(`The argumentDescriptor[${i}] of validator '${vName}' cannot be a rest parameter because it's not the last`);
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
