const V = require('.');
const leafValidators = require('./leaf-validators');
const branchValidators = require('./branch-validators');

function createValidator(obj) {
  if (Array.isArray(obj) && obj.length >= 2) {
    const [field, method, ...args] = obj;
    if (!leafValidators[method]) {
      throw new Error(`Error: Unknown leaf validator ${method}`);
    }
    return V[method](field, ...args);
  }
  if (typeof obj !== 'object') {
    throw new Error('Error: Expected either a leaf validator (array of the form [field, name, ...args]) or a composite validator (object with exactly one property where the key is its name and the value is the array of its arguments)');
  }
  const ops = Object.keys(obj);
  if (ops.length !== 1) {
    throw new Error('Error: Expected a branch validator i.e. an object with exactly one property where the key is its name and the value is the array of its arguments');
  }
  const op = ops[0];
  if (!branchValidators[op]) {
    throw new Error(`Error: Unknown branch validator '${op}'`);
  }
  return V[op](...obj[op].map(arg => createValidator(arg)));
}

module.exports = createValidator;
