import { assert } from 'chai';
import { V, compile } from '../src';

describe('Test compile().', () => {
  it('Compiling a hard-coded validator should return a function validator', () => {
    assert(typeof compile(V.isSet(null)) === 'function', ':(');
  });
  it('Compiling a non hard-coded validator should return a function validator', () => {
    assert(typeof compile({ isSet: [null] }) === 'function', ':(');
  });
  it('Compiling a reference to a non hard-coded validator should throw an error', () => {
    assert.throws(() => compile({ $var: '$MyValidator' }), Error, 'Expected a validator; found a reference instead');
  });
});
