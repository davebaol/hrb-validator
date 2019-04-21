import { assert } from 'chai';
import { shouldThrowErrorOnBadPath } from '../test-utils';
import V from '../../src';

describe('Test branch validator call.', () => {
  shouldThrowErrorOnBadPath('call');
  it('Should throw immediately an error on missing validator name', () => {
    assert.throws(() => V.call(''), Error);
  });
  it('Should throw immediately an error on bad validator name', () => {
    assert.throws(() => V.call('', 1234), Error);
  });
  it('Should throw immediately an error on bad scope', () => {
    assert.throws(() => V.call('', 'TEST', 1234), Error);
  });
  it('call("a", "TEST", {TEST: "I\'m not a validator"}) should throw an error immediately', () => {
    assert.throws(() => V.call('a', 'TEST', { TEST: "I'm not a validator" }), Error);
  });
  it('call("a", "TEST") should always fail since TEST validator is not defined', () => {
    const v = V.call('a', 'TEST');
    assert(v({ a: 123 }) !== undefined, ':(');
  });
  it('call("a", "TEST", {TEST: {isType: ["", "number"]}}) should succeed for {a: -3.14}', () => {
    const v = V.call('a', 'TEST', { TEST: { isType: ['', 'number'] } });
    assert(v({ a: -3.14 }) === undefined, ':(');
  });
  it('call("a", "TEST", {TEST: {isType: ["", "number"]}}) should fail for {a: "-3.14"}', () => {
    const v = V.call('a', 'TEST', { TEST: { isType: ['', 'number'] } });
    assert(v({ a: '-3.14' }) !== undefined, ':(');
  });
  it('call("a", "TEST", {TEST: {isType: ["", "number"]}}) should fail for {}', () => {
    const v = V.call('a', 'TEST', { TEST: { isType: ['', 'number'] } });
    assert(v({}) !== undefined, ':(');
  });
});
