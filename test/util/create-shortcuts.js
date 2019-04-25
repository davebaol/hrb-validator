import { assert } from 'chai';
import camelcase from 'camelcase';
import V from '../../src';
import createShortcuts from '../../src/util/create-shortcuts';

describe('Test shortcut opt.', () => {
  const F1 = { x: function () {}, y: function () {}, z: function () {} };
  it('Each function xyz should become optXyz', () => {
    let target = createShortcuts({}, F1);
    assert.deepEqual(Object.keys(F1).map(k => camelcase(`opt ${k}`)), Object.keys(target), ':(');
  });
  it('Only function z should become optZ', () => {
    const keys =  ['z'];
    let target = createShortcuts({}, F1, keys);
    assert.deepEqual(keys.map(k => camelcase(`opt ${k}`)), Object.keys(target), ':(');
  });
  it('Anything other than function should throw an error', () => {
    assert.throws(() => createShortcuts({}, { x: 'not a function' }), Error);
  });
  it('Missing path should always succeed', () => {
    let target = createShortcuts({}, V, ['isSet']);
    let v = target.optIsSet('a');
    assert(v({}) === undefined, ':(');
  });
  it('Not Missing path should always match the original validator', () => {
    let target = createShortcuts({}, V, ['isSet']);
    let v1 = target.optIsSet('a');
    let v2 = V.isSet('a');
    assert(v1({a: 0}) === v2({a: 32}), ':(');
  });
});

