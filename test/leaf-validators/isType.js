import { assert } from 'chai';
import V from '../../src';

describe('Test leaf validator isType.', () => {
  it('isType("a", "boolean") should succeed for {a:false}', () => {
    const v = V.isType('a', 'boolean');
    assert(v({ a: false }) === undefined, ':(');
  });
  it('isType("a", "boolean") should succeed for {a:true}', () => {
    const v = V.isType('a', 'boolean');
    assert(v({ a: true }) === undefined, ':(');
  });
  it('isType("a", "boolean") should fail for {a:null}', () => {
    const v = V.isType('a', 'boolean');
    assert(v({ a: null }) !== undefined, ':(');
  });
  it('isType("a", ["boolean","array"]) should succeed for {a:false}', () => {
    const v = V.isType('a', ['boolean', 'array']);
    assert(v({ a: false }) === undefined, ':(');
  });
  it('isType("a", ["boolean","array"]) should succeed for {a:[]}', () => {
    const v = V.isType('a', ['boolean', 'array']);
    assert(v({ a: [] }) === undefined, ':(');
  });
  it('isType("a", ["boolean","array"]) should fail for {a:"..."}', () => {
    const v = V.isType('a', ['boolean', 'array']);
    assert(v({ a: '...' }) !== undefined, ':(');
  });
});
