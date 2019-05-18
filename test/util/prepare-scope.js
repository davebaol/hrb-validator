import { assert } from 'chai';
import prepareScope from '../../src/util/prepare-scope';

describe('Test utility prepareScope(scope, ctx, obj).', () => {
  it('Should return the same scope specified in input', () => {
    const scope = {};
    assert(prepareScope(scope) === scope, ':(');
  });
  it('Should return the same scope where only validators are functions', () => {
    const scope = { VAR: { isSet: ['a'] }, $VALIDATOR: { contains: ['a', 'x'] } };
    prepareScope(scope);
    assert(Object.keys(scope).every(k => (k.startsWith('$') && typeof scope[k] === 'function') || (!k.startsWith('$') && typeof scope[k] !== 'function')), ':(');
  });
});
