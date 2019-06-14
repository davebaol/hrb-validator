const camelCase = require('camelcase');
const Info = require('./info');
const { setFunctionName } = require('./misc');

function optShortcut(validator) {
  const optValidator = (arg, ...args) => {
    const { info } = optValidator;
    const argDescriptor0 = info.argDescriptors[0];
    const aExpr = argDescriptor0.compile(arg);
    info.compileRestParams(args, 1); // Make sure other arguments compile correctly
    return (scope) => {
      if (!aExpr.resolved) {
        argDescriptor0.resolve(aExpr, scope);
        if (aExpr.error) { return aExpr.error; }
      }
      return (info.getValue(aExpr, scope) ? validator(aExpr.result, ...args)(scope) : undefined);
    };
  };
  return setFunctionName(optValidator, camelCase(`opt ${validator.info.name}`));
}

function variant(InfoClass, validator, ...args) {
  return new InfoClass(validator, ...args).consolidate();
}

function infoVariant(validator, ...args) {
  return variant(Info, validator, ...args);
}

function variantOpt(validator) {
  const { argDescriptors } = validator.info;
  return infoVariant(
    optShortcut(validator),
    ...[`${argDescriptors[0].name}:${argDescriptors[0].type.name}?`, ...argDescriptors.slice(1)]
  );
}

function variants(InfoClass, validator, ...args) {
  const mainVariant = variant(InfoClass, validator, ...args);
  return [
    mainVariant,
    variantOpt(mainVariant.validator)
  ];
}

function infoVariants(validator, ...args) {
  return variants(Info, validator, ...args);
}

function getVariant(name, commonImpl) {
  const f = (...args) => commonImpl(f.info, ...args);
  return setFunctionName(f, name);
}

function variants$(InfoClass, commonImpl, ...args) {
  let validator;
  let validator$;
  if (typeof commonImpl === 'function') {
    if (!commonImpl.name) {
      throw new Error('Expected non anonymous function; otherwise make sure it\'s not an issue due to minification');
    }
    validator = getVariant(commonImpl.name, commonImpl);
    validator$ = getVariant(`${commonImpl.name}$`, commonImpl);
  } else if (typeof commonImpl === 'string') {
    validator = commonImpl;
    validator$ = `${commonImpl}$`;
  } else {
    throw new Error('Expected either a named function or its name as first argument');
  }
  return [
    ...variants(InfoClass, validator, ...args),
    ...variants(InfoClass, validator$, ...args)
  ];
}

function infoVariants$(commonImpl, ...args) {
  return variants$(Info, commonImpl, ...args);
}

module.exports = {
  variant,
  variants,
  variants$,
  infoVariant,
  infoVariants,
  infoVariants$,
  variantOpt,
  optShortcut
};
