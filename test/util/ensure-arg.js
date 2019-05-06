import { assert } from 'chai';
import V from '../../src';
import ensureArg from '../../src/util/ensure-arg';

describe('Test utility ensureValidator(v).', () => {
  it('Should throw an error for neither plain object nor function', () => {
    assert.throws(() => ensureArg.validator(['This is not a validator']), Error);
  });
  it('Should return the same function validator specified in input', () => {
    const v = V.isSet('');
    assert(ensureArg.validator(v) === v, ':(');
  });
  it('Should throw an error for a plain object with no keys', () => {
    assert.throws(() => ensureArg.validator({}), Error);
  });
  it('Should throw an error for a plain object with more than one key', () => {
    assert.throws(() => ensureArg.validator({ isSet: [''], extraneous: [''] }), Error);
  });
  it('Should throw an error for a single-key plain object with unknown key', () => {
    assert.throws(() => ensureArg.validator({ unknown: [''] }), Error);
  });
  it('Should return a function validator for a single-key plain object with a well-known key', () => {
    assert(typeof ensureArg.validator({ isSet: [''] }) === 'function', ':(');
  });
});

describe('Test utility ensureScope(s).', () => {
  it('Should throw an error for anything other than a plain object', () => {
    assert.throws(() => ensureArg.scope(['This is not a scope']), Error);
  });
  it('Should return the same scope specified in input', () => {
    const scope = {};
    assert(ensureArg.scope(scope) === scope, ':(');
  });
  it('Should return the same scope where all of its validators are functions', () => {
    const scope = { TEST_1: { isSet: ['a'] }, TEST_2: { contains: ['a', 'x'] } };
    ensureArg.scope(scope);
    assert(Object.keys(scope).every(k => typeof scope[k] === 'function'), ':(');
  });
});
