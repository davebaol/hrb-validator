import { assert } from 'chai';
import V from '../../src';

describe('Test leaf validator isArrayOf.', () => {
  it('isArrayOf("a", "boolean") should succeed for {a:[false,true]}', () => {
    const v = V.isArrayOf('a', 'boolean');
    assert(v({ a: [false] }) === undefined, ':(');
  });
  it('isArrayOf("a", "boolean") should fail for {a:[false,"true"]}', () => {
    const v = V.isArrayOf('a', 'boolean');
    assert(v({ a: [false, 'true'] }) !== undefined, ':(');
  });
  it('isArrayOf("a", ["boolean","string"]) should succeed for {a:[false,"true"]}', () => {
    const v = V.isArrayOf('a', ['boolean', 'string']);
    assert(v({ a: [false, 'true'] }) === undefined, ':(');
  });
  it('isArrayOf("a", ["boolean","string"]) should fail for {a:[false,"true",0]}', () => {
    const v = V.isArrayOf('a', ['boolean', 'array']);
    assert(v({ a: [false, 'true', 0] }) !== undefined, ':(');
  });
});
