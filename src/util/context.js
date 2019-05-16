const VAR_NOT_FOUND = {};

class Context {
  constructor() {
    this.stack = [];
  }

  push(scope) {
    this.stack.push(scope);
  }

  pop() {
    return this.stack.pop();
  }

  static get VAR_NOT_FOUND() {
    return VAR_NOT_FOUND;
  }

  find(name) {
    for (let i = this.stack.length - 1; i >= 0; i -= 1) {
      if (name in this.stack[i]) {
        return this.stack[i][name]; // Found!
      }
    }
    return VAR_NOT_FOUND;
  }
}

module.exports = Context;
