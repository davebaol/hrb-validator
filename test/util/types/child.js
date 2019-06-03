import { assert } from 'chai';
import { getNativeType } from '../../../src/util/types';
import V from '../../../src';

describe('Test ChildType.ensure()', () => {
  const child = getNativeType('child');

  it('Should throw an error for neither plain object nor function', () => {
    assert.throws(() => child.ensure(['This is not a validator']), Error);
  });
  it('Should return a resolved expression whose value is the same function validator specified in input', () => {
    const v = V.isSet('');
    const expr = child.ensure(v);
    assert(expr.resolved && expr.result === v, ':(');
  });
  it('Should throw an error for a plain object with no keys', () => {
    assert.throws(() => child.ensure({}), Error);
  });
  it('Should throw an error for a plain object with more than one key', () => {
    assert.throws(() => child.ensure({ isSet: [''], extraneous: [''] }), Error);
  });
  it('Should throw an error for a single-key plain object with unknown key', () => {
    assert.throws(() => child.ensure({ unknown: [''] }), Error);
  });
  it('Should return a resolved expression whose value is a function validator for a single-key plain object with a well-known key', () => {
    const expr = child.ensure({ isSet: [''] });
    assert(expr.resolved && typeof expr.result === 'function', ':(');
  });
});
