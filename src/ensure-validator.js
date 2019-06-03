const child = require('./util/types').getNativeType('child');

module.exports = v => {
    const expr = child.ensure(v);
    if (expr.resolved) {
        return expr.result;
    }
    throw new Error('Expected a validator; found a reference instead');
}
