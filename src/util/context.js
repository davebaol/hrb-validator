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

  find(name) {
    for (let i = this.stack.length - 1; i >= 0; i -= 1) {
      const found = this.stack[i][name];
      if (found) {
        return found;
      }
    }
    return undefined;
  }
}

module.exports = Context;
