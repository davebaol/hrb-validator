import { assert } from 'chai';
import { testArgument } from '../test-utils';
import V from '../../src';

describe('Test branch validator def.', () => {
  it('Should throw immediately an error on bad variables', () => {
    assert.throws(() => V.def('Bad variables', {}, { isType: ['', 'number'] }), Error);
  });
  it('Should throw immediately an error on bad validators', () => {
    assert.throws(() => V.def({}, 'Bad validators', { isType: ['', 'number'] }), Error);
  });
  testArgument(V.def, [{}], 1);
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
});
