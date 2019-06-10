import { assert } from 'chai';
import camelcase from 'camelcase';
import V from '../../src';
import Scope from '../../src/util/scope';
import createShortcuts from '../../src/util/create-shortcuts';

describe('Test shortcut opt.', () => {
  const F1 = { x: V.isSet, y: V.isType, z: V.every };
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
  it('A function without info should throw an error', () => {
    assert.throws(() => createShortcuts({}, { x: () => {} }), Error);
  });
  it('A function validator not taking a path as first argument should throw an error', () => {
    assert.throws(() => createShortcuts({}, V, ['and']), Error, 'path as first argument');
  });
  it('Missing property at path should always succeed', () => {
    const target = createShortcuts({}, V, ['isSet']);
    const v = target.optIsSet('a');
    assert(v(new Scope({})) === undefined, ':(');
  });
  it('Not missing property at path should always match the original validator', () => {
    const target = createShortcuts({}, V, ['isSet']);
    const v1 = target.optIsSet('a');
    const v2 = V.isSet('a');
    assert(v1(new Scope({ a: 0 })) === v2(new Scope({ a: 32 })), ':(');
  });
  it('Missing property at referenced path should always succeed', () => {
    const target = createShortcuts({}, V, ['isSet']);
    const v = V.def({ p: 'a' }, target.optIsSet({ $var: 'p' }));
    assert(v(new Scope({})) === undefined, ':(');
  });
  it('Not missing property at referenced path should always match the original validator', () => {
    const target = createShortcuts({}, V, ['isSet']);
    const v1 = V.def({ p: 'a' }, target.optIsSet({ $var: 'p' }));
    const v2 = V.def({ p: 'a' }, V.optIsSet({ $var: 'p' }));
    assert(v1(new Scope({ a: 0 })) === v2(new Scope({ a: 32 })), ':(');
  });
});
