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

describe('Test utility ensurePath(path).', () => {
  it('ensurePath() should return undefined', () => {
    assert(U.ensurePath() === undefined, ':(');
  });
  it('ensurePath("") should return undefined', () => {
    assert(U.ensurePath('') === undefined, ':(');
  });
  it('ensurePath([]) should return undefined', () => {
    assert(U.ensurePath([]) === undefined, ':(');
  });
  it('ensurePath(non_empty_string) should return an array', () => {
    assert(Array.isArray(U.ensurePath('"a.b.c[0]"')), ':(');
  });
  it('ensurePath(non_empty_array) should return an array', () => {
    assert(Array.isArray(U.ensurePath(['a', 'b', 'c', 0])), ':(');
  });
  it('ensurePath(1234) should throw an error', () => {
    assert.throws(() => U.ensurePath(1234), Error);
  });
});

describe('Test utility get(obj, path).', () => {
  it('get(point) should return point', () => {
    assert(U.get(point) === point, ':(');
  });
  it('get(point, "x") should return point.x', () => {
    assert(U.get(point, 'x') === point.x, ':(');
  });
  it('get(list, "[1]") should return list[1]', () => {
    assert(U.get(list, '[1]') === list[1], ':(');
  });
  it('get(list, [1]) should return list[1]', () => {
    assert(U.get(list, [1]) === list[1], ':(');
  });
});
