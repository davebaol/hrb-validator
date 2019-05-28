const ANY_VALUE = Object.freeze(['boolean', 'number', 'object', 'string', 'undefined']
  .reduce((acc, k) => {
    acc[k] = true;
    return acc;
  }, {}));

const hasOwn = Object.prototype.hasOwnProperty;

// This is an optimized version of the following code
//   let keys = Object.keys(obj);
//   return keys.length === 1 ? keys[0] : undefined;
function checkUniqueKey(obj) {
  let k0;
  // eslint-disable-next-line no-restricted-syntax
  for (const k in obj) {
    if (hasOwn.call(obj, k)) {
      if (k0 !== undefined) {
        return undefined;
      }
      k0 = k;
    }
  }
  return k0;
}

// Call this function from inside a getter to create on the specified instance (usually
// passed as 'this') a property with the same name that shadows the getter itself
function lazyProperty(instance, key, value, writable, configurable) {
  Object.defineProperty(instance, key, { value, writable, configurable });
  return value;
}

module.exports = {
  ANY_VALUE,
  checkUniqueKey,
  lazyProperty
};
