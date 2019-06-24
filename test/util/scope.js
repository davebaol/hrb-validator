import { assert } from 'chai';
import Expression from '../../src/util/expression';
import { V, Scope } from '../../src';

describe('Test utility Scope.compile($, scope).', () => {
  it('Should throw an error if the scope is a root reference', () => {
    const defs = { $var: 'MY_OTHER_SCOPE' };
    assert.throws(() => Scope.compile(null, defs), Error, 'Root reference not allowed');
  });
  it('Should throw an error if $ is shadowed ', () => {
    const defs = { $: 'invalid variable' };
    assert.throws(() => Scope.compile(null, defs), Error, '$ cannot be shadowed');
  });
  it('Should return the same scope specified in input, if all its variables have no references (constants)', () => {
    const defs = { VARIABLE: 123 };
    assert(Scope.compile(null, defs).resources === defs, ':(');
  });
  it('Should return the same scope specified in input, if all its its validators are hard-coded', () => {
    const defs = { $VALIDATOR: V.contains('a', 'x') };
    assert(Scope.compile(null, defs).resources === defs, ':(');
  });
  it('Should return a new scope, if the scope specified in input defines any variable with references (non constant)', () => {
    const defs = { VARIABLE: { $var: 'V1' } };
    assert(Scope.compile(null, defs).resources !== defs, ':(');
  });
  it('Should return a new scope, if the scope specified in input defines any validator in the form of data', () => {
    const defs = { $VALIDATOR: { contains: ['a', 'x'] } };
    assert(Scope.compile(null, defs).resources !== defs, ':(');
  });
  it('Should return a new scope where the variables and validators have the expected type', () => {
    const defs = {
      VAR_1: { name: 'David' }, // regular object
      VAR_2: { $var: 'ANY_OTHER_VAR' }, // value reference
      $VALIDATOR_1: V.contains('a', 'x'), // hard-coded validator
      $VALIDATOR_2: { contains: ['a', 'x'] }, // validator in the form of data
      $VALIDATOR_3: { $var: '$VALIDATOR_1' } // validator reference
    };
    const { resources } = Scope.compile(null, defs);
    const expected = resources !== defs
      && typeof resources.VAR_1 === 'object' && !(resources.VAR_1 instanceof Expression)
      && resources.VAR_2 instanceof Expression
      && typeof resources.$VALIDATOR_1 === 'function'
      && typeof resources.$VALIDATOR_2 === 'function'
      && resources.$VALIDATOR_3 instanceof Expression;
    assert(expected && Object.keys(resources).length === Object.keys(defs).length, ':(');
  });
});
