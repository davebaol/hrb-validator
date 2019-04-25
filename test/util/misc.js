import { assert } from 'chai';
import V from '../../src';
import U from '../../src/util/misc';

describe('Test utility ensureValidator(v).', () => {
  it('Should throw an error for neither object nor function', () => {
    assert.throws(() => U.ensureValidator(1234), Error);
  });
  it('Should return the same function validator specified in input', () => {
    const v = V.isSet('');
    assert(U.ensureValidator(v) === v, ':(');
  });
  it('Should return a function validator if the specified argument is a plain object', () => {
    assert(typeof U.ensureValidator({ isSet: [''] }) === 'function', ':(');
  });
});
