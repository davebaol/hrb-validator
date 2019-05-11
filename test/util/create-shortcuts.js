import { assert } from 'chai';
import camelcase from 'camelcase';
import V from '../../src';
import createShortcuts from '../../src/util/create-shortcuts';

describe('Test shortcut opt.', () => {
  const F1 = { x() {}, y() {}, z() {} };
  it('Each function xyz should become optXyz', () => {
    const target = createShortcuts({}, F1);
    assert.deepEqual(Object.keys(F1).map(k => camelcase(`opt ${k}`)), Object.keys(target), ':(');
  });
  it('Only function z should become optZ', () => {
    const keys = ['z'];
    const target = createShortcuts({}, F1, keys);
    assert.deepEqual(keys.map(k => camelcase(`opt ${k}`)), Object.keys(target), ':(');
  });
  it('Anything other than function should throw an error', () => {
    assert.throws(() => createShortcuts({}, { x: 'not a function' }), Error);
  });
  it('Missing path should always succeed', () => {
    const target = createShortcuts({}, V, ['isSet']);
    const v = target.optIsSet('a');
    assert(v({}) === undefined, ':(');
  });
  it('Not missing path should always match the original validator', () => {
    const target = createShortcuts({}, V, ['isSet']);
    const v1 = target.optIsSet('a');
    const v2 = V.isSet('a');
    assert(v1({ a: 0 }) === v2({ a: 32 }), ':(');
  });
  it('Missing referenced path should always succeed', () => {
    const target = createShortcuts({}, V, ['isSet']);
    const v = V.def({ p: 'a' }, target.optIsSet({ $var: 'p' }));
    assert(v({}) === undefined, ':(');
  });
  it('Not missing referenced path should always match the original validator', () => {
    const target = createShortcuts({}, V, ['isSet']);
    const v1 = V.def({ p: 'a' }, target.optIsSet({ $var: 'p' }));
    const v2 = V.def({ p: 'a' }, V.optIsSet({ $var: 'p' }));
    assert(v1({ a: 0 }) === v2({ a: 32 }), ':(');
  });
});
