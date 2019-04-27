import { assert } from 'chai';
import V from '../../src';
import U from '../../src/util/misc';

describe('Test utility ensureValidator(v).', () => {
  it('Should throw an error for neither plain object nor function', () => {
    assert.throws(() => U.ensureValidator(['This is not a validator']), Error);
  });
  it('Should return the same function validator specified in input', () => {
    const v = V.isSet('');
    assert(U.ensureValidator(v) === v, ':(');
  });
  it('Should throw an error for a plain object with no keys', () => {
    assert.throws(() => U.ensureValidator({}), Error);
  });
  it('Should throw an error for a plain object with more than one key', () => {
    assert.throws(() => U.ensureValidator({ isSet: [''], extraneous: [''] }), Error);
  });
  it('Should throw an error for a single-key plain object with unknown key', () => {
    assert.throws(() => U.ensureValidator({ unknown: [''] }), Error);
  });
  it('Should return a function validator for a single-key plain object with a well-known key', () => {
    assert(typeof U.ensureValidator({ isSet: [''] }) === 'function', ':(');
  });
});

describe('Test utility ensureScope(s).', () => {
  it('Should throw an error for anything other than a plain object', () => {
    assert.throws(() => U.ensureScope(['This is not a scope']), Error);
  });
  it('Should return the same scope specified in input', () => {
    const scope = {};
    assert(U.ensureScope(scope) === scope, ':(');
  });
  it('Should return the same scope where all of its validators are functions', () => {
    const scope = { TEST_1: { isSet: ['a'] }, TEST_2: { contains: ['a', 'x'] } };
    U.ensureScope(scope);
    assert(Object.keys(scope).every(k => typeof scope[k] === 'function'), ':(');
  });
});
