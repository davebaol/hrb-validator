
function parseArgDescriptors(descriptors) {
  return descriptors.map((d) => {
    if (typeof d === 'string') {
      const p = d.split(':').map(s => s.trim()); // ...name:type? where '?' means optional and ... rest parameters
      const restParams = p[0].startsWith('...');
      const name = restParams ? p[0].substring(3).trim() : p[0];
      const optional = p[1].endsWith('?');
      const type = optional ? p[1].substring(0, p[1].length - 1).trim() : p[1];
      return {
        stringDesc: d, restParams, name, type, optional
      };
    }
    return d;
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
      this.validator = this.link();
    } else {
      throw new Error('Expected the function or its name as first argument');
    }
    this.validator.owner = this;
    this.argDescriptors = parseArgDescriptors(argDescriptors);
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
}

module.exports = Info;
