import { assert } from 'chai';
import { get, ensureArrayPath } from '../../src/util/path';

describe('Test utility get(obj, path).', () => {
  const point = { x: 0, y: 1 };
  const list = [6, -4, 7];
  it('get(point) should return point', () => {
    assert(get(point) === point, ':(');
  });
  it('get(point, "x") should return point.x', () => {
    assert(get(point, 'x') === point.x, ':(');
  });
  it('get(list, "1") should return list[1]', () => {
    assert(get(list, '1') === list[1], ':(');
  });
  it('get(list, 1) should return list[1]', () => {
    assert(get(list, 1) === list[1], ':(');
  });
  it('get(list, [1]) should return list[1]', () => {
    assert(get(list, [1]) === list[1], ':(');
  });
});

describe('Test utility ensureArrayPath(path).', () => {
  it('ensureArrayPath() should return undefined', () => {
    assert(ensureArrayPath() === undefined, ':(');
  });
  it('ensureArrayPath("") should return undefined', () => {
    assert(ensureArrayPath('') === undefined, ':(');
  });
  it('ensureArrayPath([]) should return undefined', () => {
    assert(ensureArrayPath([]) === undefined, ':(');
  });
  it('ensureArrayPath(non_empty_string) should return an array', () => {
    assert(Array.isArray(ensureArrayPath('"a.b.c.0"')), ':(');
  });
  it('ensureArrayPath(non_empty_array) should return an array', () => {
    assert(Array.isArray(ensureArrayPath(['a', 'b', 'c', 0])), ':(');
  });
  it('ensureArrayPath(123) should return an array with length 1', () => {
    const p = ensureArrayPath(123);
    assert(Array.isArray(p) && p.length === 1, ':(');
  });
  it('ensureArrayPath(123.456) should return an array with length 2', () => {
    const p = ensureArrayPath(123.456);
    assert(Array.isArray(p) && p.length === 2, ':(');
  });
  it('ensureArrayPath(bad_path) should throw an error', () => {
    assert.throws(() => ensureArrayPath({}), Error);
  });
});
