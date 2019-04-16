import { assert } from 'chai';
import U from '../src/util';

describe('Test utility get(obj, path).', () => {
  const point = { x: 0, y: 1 };
  const list = [6, -4, 7];

  it('get(point) should return point', () => {
    assert(U.get(point) === point, ':(');
  });
  it('get(point, "") should return point', () => {
    assert(U.get(point, '') === point, ':(');
  });
  it('get(point, []) should return point', () => {
    assert(U.get(point, []) === point, ':(');
  });
  it('get(point, "x") should return pooint.x', () => {
    assert(U.get(point, 'x') === point.x, ':(');
  });
  it('get(list, "[1]") should return list[1]', () => {
    assert(U.get(list, '[1]') === list[1], ':(');
  });
  it('get(list, [1]) should return list[1]', () => {
    assert(U.get(list, [1]) === list[1], ':(');
  });
});
