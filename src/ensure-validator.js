const ensureChild = require('./util/types').getNativeType('child').ensure;

module.exports = v => ensureChild(v, true);
