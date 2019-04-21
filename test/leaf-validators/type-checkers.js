import { assert } from 'chai';
import shouldThrowErrorOnBadPath from '../test-utils';
import V from '../../src';

function shouldThrowErrorOnBadType(validatorName, errorLike) {
  it('Should throw immediately an error on bad type', () => {
    assert.throws(() => V[validatorName]('', 'bad_type'), errorLike || Error);
  });
}

describe('Test leaf validator isType.', () => {
  shouldThrowErrorOnBadPath('isType');
  shouldThrowErrorOnBadType('isType');
  it('Empty path: isType("", "object") should succeed for {a: ""}', () => {
    const v = V.isType('', 'object');
    assert(v({ a: '' }) === undefined, ':(');
  });
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

describe('Test leaf validator isArrayOf.', () => {
  shouldThrowErrorOnBadPath('isArrayOf');
  shouldThrowErrorOnBadType('isArrayOf');
  it('Empty path: isArrayOf("", "boolean") should succeed for [false]', () => {
    const v = V.isArrayOf('', 'boolean');
    assert(v([false]) === undefined, ':(');
  });
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
