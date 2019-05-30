import { assert } from 'chai';
import { ensureScope } from '../../src/util/ensure-scope';
import Reference from '../../src/util/reference';
import V from '../../src';

describe('Test utility ensureScope(scope).', () => {
  it('Should throw an error if the scope is a root reference', () => {
    const scope = { $var: 'MY_OTHER_SCOPE' };
    assert.throws(() => ensureScope(scope), Error, 'Root reference not allowed');
  });
  it('Should return the same scope specified in input, if all its variables have no references (constants)', () => {
    const scope = { VARIABLE: 123 };
    assert(ensureScope(scope) === scope, ':(');
  });
  it('Should return the same scope specified in input, if all its its validators are hard-coded', () => {
    const scope = { $VALIDATOR: V.contains('a', 'x') };
    assert(ensureScope(scope) === scope, ':(');
  });
  it('Should return a new scope, if the scope specified in input defines any variable with references (non constant)', () => {
    const scope = { VARIABLE: { $var: 'V1' } };
    assert(ensureScope(scope) !== scope, ':(');
  });
  it('Should return a new scope, if the scope specified in input defines any validator in the form of data', () => {
    const scope = { $VALIDATOR: { contains: ['a', 'x'] } };
    assert(ensureScope(scope) !== scope, ':(');
  });
  it('Should return a new scope where the variables and validators have the expected type', () => {
    const scope = {
      VAR_1: { name: 'David' }, // regular object
      VAR_2: { $var: 'ANY_OTHER_VAR' }, // value reference
      $VALIDATOR_1: V.contains('a', 'x'), // hard-coded validator
      $VALIDATOR_2: { contains: ['a', 'x'] }, // validator in the form of data
      $VALIDATOR_3: { $var: '$VALIDATOR_1' } // validator reference
    };
    const newScope = ensureScope(scope);
    const expected = newScope !== scope
      && typeof newScope.VAR_1 === 'object' && !(newScope.VAR_1 instanceof Reference)
      && newScope.VAR_2 instanceof Reference
      && typeof newScope.$VALIDATOR_1 === 'function'
      && typeof newScope.$VALIDATOR_2 === 'function'
      && newScope.$VALIDATOR_3 instanceof Reference;
    assert(expected && Object.keys(newScope).length === Object.keys(scope).length, ':(');
  });
});
