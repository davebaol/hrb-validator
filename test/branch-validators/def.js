import { assert } from 'chai';
import V from '../../src';
import { testAllArguments, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE } = VALIDATION;

describe('Test branch validator def.', () => {
  it('Should throw immediately an error on bad variables', () => {
    assert.throws(() => V.def('Bad variables', {}, { isType: ['', 'number'] }), Error);
  });
  it('Should throw immediately an error on bad validators', () => {
    assert.throws(() => V.def({}, 'Bad validators', { isType: ['', 'number'] }), Error);
  });
  testAllArguments(V.def, [{}, V.optIsSet('')]);
  testValidation(SUCCESS, { a: -3.14 }, V.def, { v1: -3.14 }, { equals: ['a', { $var: 'v1' }] });
  testValidation(FAILURE, { a: 'not -3.14' }, V.def, { v1: -3.14 }, { equals: ['a', { $var: 'v1' }] });
  it('def({}, V.optIsSet("")) should always succeed just like its child', () => {
    const v = V.def({}, V.optIsSet(''));
    assert(v({ a: 123 }) === undefined, ':(');
  });
  it('def({$TEST: V.optIsSet("")}, {$var: "$TEST"}) should always succeed just like its referenced hard-coded child', () => {
    const v = V.def({ $TEST: V.optIsSet('') }, { $var: '$TEST' });
    assert(v({ a: 123 }) === undefined, ':(');
  });
  it('def({$TEST: {optIsSet: [""]}, {$var: "$TEST"}) should always succeed just like its referenced soft-coded child', () => {
    const v = V.def({ $TEST: { optIsSet: [''] } }, { $var: '$TEST' });
    assert(v({ a: 123 }) === undefined, ':(');
  });
  it('Scope of inner def can reference variable of outer def', () => {
    const v = V.def(
      { v1: 123 },
      V.def(
        { v2: { $var: 'v1' } },
        { equals: ['a', { $var: 'v2' }] }
      )
    );
    assert(v({ a: 123 }) === undefined, ':(');
  });
  it('Variable in a scope can make a backward reference to a variable in the same scope', () => {
    const v = V.def(
      {
        v1: 123,
        v2: { $var: 'v1' }
      },
      { equals: ['a', { $var: 'v2' }] }
    );
    assert(v({ a: 123 }) === undefined, ':(');
  });
  it('Variable in a scope cannot make a forward reference to a variable in the same scope', () => {
    const v = V.def(
      {
        v2: { $var: 'v1' },
        v1: 123
      },
      { equals: ['a', { $var: 'v2' }] }
    );
    assert(v({ a: 123 }) !== undefined, ':(');
  });
});
