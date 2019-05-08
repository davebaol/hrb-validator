import { assert } from 'chai';
import V from '../../src';
import ensureArg from '../../src/util/ensure-arg';

const { REF } = ensureArg;

describe('Test utility ensureArg.child(v).', () => {
  it('Should throw an error for neither plain object nor function', () => {
    assert.throws(() => ensureArg.child(['This is not a validator']), Error);
  });
  it('Should return the same function validator specified in input', () => {
    const v = V.isSet('');
    assert(ensureArg.child(v) === v, ':(');
  });
  it('Should throw an error for a plain object with no keys', () => {
    assert.throws(() => ensureArg.child({}), Error);
  });
  it('Should throw an error for a plain object with more than one key', () => {
    assert.throws(() => ensureArg.child({ isSet: [''], extraneous: [''] }), Error);
  });
  it('Should throw an error for a single-key plain object with unknown key', () => {
    assert.throws(() => ensureArg.child({ unknown: [''] }), Error);
  });
  it('Should return a function validator for a single-key plain object with a well-known key', () => {
    assert(typeof ensureArg.child({ isSet: [''] }) === 'function', ':(');
  });
});

describe('Test utility ensureArg.children(array).', () => {
  it('Should return the same array specified in input if all its validators are hard-coded', () => {
    const vlds = [V.isSet('a'), V.isSet('b')];
    assert(ensureArg.children(vlds) === vlds, ':(');
  });
  it('Should return a new array if any of the validators specified in input is non hard-coded', () => {
    const vlds = [V.isSet('a'), { isSet: ['b'] }];
    const ensuredValidators = ensureArg.children(vlds);
    assert(ensuredValidators !== vlds && Array.isArray(ensuredValidators), ':(');
  });
  it('Should return a new array made only of validators if references are not used in input validators', () => {
    const vlds = [V.isSet('a'), { isSet: ['b'] }];
    const ensuredValidators = ensureArg.children(vlds);
    assert(ensuredValidators.every(v => typeof v === 'function'), ':(');
  });
  it('Should return a new mixed array made of validators and references at proper index', () => {
    const vlds = [V.isSet('a'), { isSet: ['b'] }];
    const valRefIndex = 1;
    vlds.splice(valRefIndex, 0, { $val: 'this_is_a_validator_reference' });
    const ensuredValidators = ensureArg.children(vlds);
    assert(ensuredValidators.every((v, i) => (i === valRefIndex ? v === REF : typeof v === 'function')), ':(');
  });
});

describe('Test utility ensureArg.scope(s).', () => {
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
