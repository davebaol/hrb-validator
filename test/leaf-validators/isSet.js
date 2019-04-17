import { assert } from 'chai';
import V from '../../src';

describe('Test leaf validator isSet.', () => {
  it('isSet("a") should succeed for {a:false}', () => {
    const v = V.isSet('a');
    assert(v({ a: false }) === undefined, ':(');
  });
  it('isSet("a") should succeed for {a:{}}', () => {
    const v = V.isSet('a');
    assert(v({ a: {} }) === undefined, ':(');
  });
  it('isSet("a") should fail for {a:null}', () => {
    const v = V.isSet('a');
    assert(v({ a: null }) !== undefined, ':(');
  });
  it('isSet("a") should fail for {}', () => {
    const v = V.isSet('a');
    assert(v({}) !== undefined, ':(');
  });
});
