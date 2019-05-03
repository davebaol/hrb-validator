import { assert } from 'chai';
import { get, ensureArrayPath } from '../../src/util/path';

describe('Test utility get(obj, path).', () => {
  const point = { x: 0, y: 1 };
  const list = [6, -4, 7];
  const tests = [
    { args: [point], expected: point },
    { args: [point, ''], expected: point },
    { args: [point, 'x'], expected: point.x },
    { args: [list, '1'], expected: list[1] },
    { args: [list, 1], expected: list[1] },
    { args: [list, [1]], expected: list[1] }
  ];
  tests.forEach(t => it(`get(${t.args.map(a => JSON.stringify(a)).join(', ')}) should return ${JSON.stringify(t.expected)}`, () => {
    assert.deepEqual(get(...t.args), t.expected, ':(');
  }));
});

describe('Test utility ensureArrayPath(path).', () => {
  const tests = [
    { path: undefined, expected: undefined },
    { path: null, expected: undefined },
    { path: '', expected: undefined },
    { path: [], expected: undefined },
    { path: 'a.b.c.0', expected: ['a', 'b', 'c', '0'] },
    { path: ['a', 'b', '3', 'c', 0], expected: ['a', 'b', '3', 'c', 0] },
    { path: 123, expected: ['123'] },
    { path: 123.456, expected: ['123', '456'] }
  ];
  tests.forEach(t => it(`ensureArrayPath(${JSON.stringify(t.path)}) should return ${JSON.stringify(t.expected)}`, () => {
    assert.deepEqual(ensureArrayPath(t.path), t.expected, ':(');
  }));
  it('ensureArrayPath(bad_path) should throw an error', () => {
    assert.throws(() => ensureArrayPath({}), Error);
  });
});
