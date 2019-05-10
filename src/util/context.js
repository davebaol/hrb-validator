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
      const found = this.stack[i][name];
      if (found !== undefined) { // TODO maybe we should use (name in this.stack[i])
        return found;
      }
    }
    return VAR_NOT_FOUND;
  }
}

module.exports = Context;
