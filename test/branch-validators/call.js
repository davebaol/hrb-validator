import { assert } from 'chai';
import { testArgument } from '../test-utils';
import V from '../../src';

describe('Test branch validator call.', () => {
  const args = ['', V.isSet('a')];
  testArgument('path', 'call', args, 0);
  testArgument('child', 'call', args, 1);
  it('call("a", {isType: ["", "number"]}) should succeed for {a: -3.14}', () => {
    const v = V.call('a', { isType: ['', 'number'] });
    assert(v({ a: -3.14 }) === undefined, ':(');
  });
  it('call("a", {isType: ["", "number"]}) should fail for {a: "-3.14"}', () => {
    const v = V.call('a', { isType: ['', 'number'] });
    assert(v({ a: '-3.14' }) !== undefined, ':(');
  });
  it('call("a", {isType: ["", "number"]}) should fail for {}', () => {
    const v = V.call('a', { isType: ['', 'number'] });
    assert(v({}) !== undefined, ':(');
  });
});
