import { assert } from 'chai';
import V from '../src';
import U from '../src/util';

describe('Test utility ensureValidator(v).', () => {
  it('Should throw an error for neither object nor function', () => {
    assert.throws(() => U.ensureValidator(1234), Error);
  });
  it('Should return the same function validator specified in input', () => {
    const v = V.isSet('');
    assert(U.ensureValidator(v) === v, ':(');
  });
  it('Should return a function validator if the specified argument is a plain object', () => {
    assert(typeof U.ensureValidator({ isSet: [''] }) === 'function', ':(');
  });
});

const point = { x: 0, y: 1 };
const list = [6, -4, 7];

describe('Test utility ensureArrayPath(path).', () => {
  it('ensureArrayPath() should return undefined', () => {
    assert(U.ensureArrayPath() === undefined, ':(');
  });
  it('ensureArrayPath("") should return undefined', () => {
    assert(U.ensureArrayPath('') === undefined, ':(');
  });
  it('ensureArrayPath([]) should return undefined', () => {
    assert(U.ensureArrayPath([]) === undefined, ':(');
  });
  it('ensureArrayPath(non_empty_string) should return an array', () => {
    assert(Array.isArray(U.ensureArrayPath('"a.b.c.0"')), ':(');
  });
  it('ensureArrayPath(non_empty_array) should return an array', () => {
    assert(Array.isArray(U.ensureArrayPath(['a', 'b', 'c', 0])), ':(');
  });
  it('ensureArrayPath(123) should return an array with length 1', () => {
    const p = U.ensureArrayPath(123);
    assert(Array.isArray(p) && p.length === 1, ':(');
  });
  it('ensureArrayPath(123.456) should return an array with length 2', () => {
    const p = U.ensureArrayPath(123.456);
    assert(Array.isArray(p) && p.length === 2, ':(');
  });
  it('ensureArrayPath(bad_path) should throw an error', () => {
    assert.throws(() => U.ensureArrayPath({}), Error);
  });
});

describe('Test utility get(obj, path).', () => {
  it('get(point) should return point', () => {
    assert(U.get(point) === point, ':(');
  });
  it('get(point, "x") should return point.x', () => {
    assert(U.get(point, 'x') === point.x, ':(');
  });
  it('get(list, "1") should return list[1]', () => {
    assert(U.get(list, '1') === list[1], ':(');
  });
  it('get(list, 1) should return list[1]', () => {
    assert(U.get(list, 1) === list[1], ':(');
  });
  it('get(list, [1]) should return list[1]', () => {
    assert(U.get(list, [1]) === list[1], ':(');
  });
});
