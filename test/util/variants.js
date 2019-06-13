import { assert } from 'chai';
import { V, Scope } from '../../src';
import { infoVariants, optInfoVariant } from '../../src/util/variants';

describe('Test optShortcut().', () => {
  function optOf(validator) {
    return optInfoVariant(validator).validator;
  }

  it('Function xyz should become optXyz', () => {
    const optIsSet = optOf(V.isSet);
    assert(optIsSet.info.name === 'optIsSet', ':(');
  });
  it('Bad value as 1st argument should throw an error at compile time', () => {
    const optIsType = optOf(V.isType);
    assert.throws(() => optIsType(() => null, 'string'), Error, 'Expected type \'any\'');
  });
  it('Bad value as 2nd argument should throw an error at compile time', () => {
    const optIsType = optOf(V.isType);
    assert.throws(() => optIsType('a', 2), Error, 'Expected type \'string|array\'');
  });
  it('Missing property at path should succeed', () => {
    const optIsSet = optOf(V.isSet);
    const v = optIsSet('a');
    assert(v(new Scope({})) === undefined, ':(');
  });
  it('Not missing property at path should always match the original validator', () => {
    const optIsSet = optOf(V.isSet);
    const v1 = optIsSet('a');
    const v2 = V.isSet('a');
    assert(v1(new Scope({ a: 0 })) === v2(new Scope({ a: 32 })), ':(');
  });
  it('Missing property at referenced path should always succeed', () => {
    const optIsSet = optOf(V.isSet);
    const v = V.def({ p: 'a' }, optIsSet({ $var: 'p' }));
    assert(v(new Scope({})) === undefined, ':(');
  });
  it('Not missing property at referenced path should always match the original validator', () => {
    const optIsSet = optOf(V.isSet);
    const v1 = V.def({ p: 'a' }, optIsSet({ $var: 'p' }));
    const v2 = V.def({ p: 'a' }, V.optIsSet({ $var: 'p' }));
    assert(v1(new Scope({ a: 0 })) === v2(new Scope({ a: 32 })), ':(');
  });
});

describe('Test infoVariants().', () => {
  it('Passing a non function should throw an error', () => {
    assert.throws(() => infoVariants('not a function'), Error, 'expected a named function');
  });
  it('Passing a non named function should throw an error', () => {
    assert.throws(() => infoVariants(() => null), Error, 'expected a named function');
  });
  it('Passing a named function should return the info for that function and its opt shortcut', () => {
    function foo(any) { return any; }
    const info = infoVariants(foo, 'value:any');
    assert.deepEqual(info.map(i => i.validator.name), ['foo', 'optFoo'], ':(');
  });
});
