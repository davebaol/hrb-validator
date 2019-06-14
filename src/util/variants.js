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

function infoVariant(validator, ...argDescriptors) {
  if (typeof validator !== 'function' || !validator.name) {
    throw new Error('infoVariant: expected a named function');
  }
  return new Info(validator, ...argDescriptors).consolidate();
}

function optInfoVariant(validator) {
  if (typeof validator !== 'function' || !validator.info || !Object.isFrozen(validator.info)) {
    throw new Error('infoOptVariant: expected a validator whose info property is consolidated');
  }
  const { argDescriptors } = validator.info;
  return new Info(
    optShortcut(validator),
    ...[`${argDescriptors[0].name}:${argDescriptors[0].type.name}?`, ...argDescriptors.slice(1)]
  ).consolidate();
}

function infoVariants(validator, ...argDescriptors) {
  return [
    infoVariant(validator, ...argDescriptors),
    optInfoVariant(validator)
  ];
}

function getVariant(name, commonImpl) {
  const f = (...args) => commonImpl(f.info, ...args);
  return setFunctionName(f, name);
}

function infoVariants$(commonImpl, ...argDescriptors) {
  const { name } = commonImpl;
  const func = typeof commonImpl === 'function' ? commonImpl : commonImpl.func;
  const validator = getVariant(name, func);
  const validator$ = getVariant(`${name}$`, func);
  return [
    ...infoVariants(validator, ...argDescriptors),
    ...infoVariants(validator$, ...argDescriptors)
  ];
}

module.exports = {
  infoVariant,
  infoVariants,
  infoVariants$,
  optInfoVariant,
  optShortcut
};
