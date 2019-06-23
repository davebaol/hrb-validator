const camelCase = require('camelcase');
const Argument = require('./argument');
const { get } = require('../util/path');
const { setFunctionName } = require('./misc');

class Info {
  constructor(baseName, ...argDescriptors) {
    this.baseName = baseName;
    this.argDescriptors = argDescriptors;
  }

  static variants(InfoClass, ...args) {
    return [
      new InfoClass(...args).prepare(false, false),
      new InfoClass(...args).prepare(false, true),
      new InfoClass(...args).prepare(true, false),
      new InfoClass(...args).prepare(true, true)
    ];
  }

  error(msg) {
    return `${this.name}: ${msg}`;
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
  resolveRestParams(exprs, offset, scope) {
    for (let i = 0, len = exprs.length; i < len; i += 1) {
      if (!exprs[i].resolved) {
        const ad = this.argDescriptors[this.adjustArgDescriptorIndex(i + offset)];
        if (ad.resolve(exprs[i], scope).error) {
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
  create() {
    /* istanbul ignore next */
    throw new Error('Subclasses must implement the method create!');
  }

  processArgDescriptors(context) {
    const last = this.argDescriptors.length - 1;
    this.isLeaf = true;
    this.argDescriptors = this.argDescriptors.map((d, i) => {
      let a;
      try {
        a = new Argument(d, context);
      } catch (e) {
        throw new Error(this.error(`bad argument at index ${i}: ${e.message}`));
      }
      if (i < last && a.restParams) {
        throw new Error(this.error(`bad argument at index ${i}: rest parameter is allowed only for the last argument`));
      }
      if (a.type.acceptsValidator) {
        this.isLeaf = false;
      }
      return a;
    });
    if (this.originalArg0Desc) {
      this.originalArg0Desc = new Argument(this.originalArg0Desc, context);
    }
  }

  variant(isOpt, is$, context) {
    this.isOpt$ = !!isOpt;
    this.is$ = !!is$;
    this.name = isOpt ? camelCase(`opt ${this.baseName}`) : this.baseName;
    if (isOpt) {
      this.argDescriptors = [`${this.argDescriptors[0]}?`, ...this.argDescriptors.slice(1)];
      const original = this.create();
      this.create = () => (arg, ...args) => {
        const aArg = this.argDescriptors[0];
        const aExpr = aArg.compile(arg);
        this.compileRestParams(args, 1); // Make sure other arguments compile correctly
        return (scope) => {
          if (!aExpr.resolved) {
            if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
          }
          return (this.getValue(aExpr, scope) ? original(aExpr.result, ...args)(scope) : undefined);
        };
      };
    }
    if (is$) {
      this.name = `${this.name}$`;
      this.getValue = (expr, scope) => get(scope.find('$'), expr.result);
      [this.originalArg0Desc] = this.argDescriptors;
      this.argDescriptors = ['path:path', ...this.argDescriptors.slice(1)];
    } else {
      this.getValue = expr => expr.result;
      this.originalArg0Desc = undefined;
    }
    this.processArgDescriptors(context);
    return this.create();
  }

  /*
   This method MUST be called before using the instance
  */
  prepare(isOpt, is$, context) {
    this.validator = this.variant(isOpt, is$, context);
    this.validator.info = this;
    setFunctionName(this.validator, this.name);
    return Object.freeze(this); // Return this for chaining
  }
}

module.exports = Info;
