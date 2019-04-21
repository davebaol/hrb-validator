import { assert } from 'chai';
import shouldThrowErrorOnBadPath from '../test-utils';
import V from '../../src';

function testEveryOrSome(name) {
  const isEvery = name === 'every';
  const successForEvery = () => (isEvery ? undefined : 'error');
  const failureForEvery = () => (isEvery ? 'error' : undefined);
  describe(`Test branch validator ${name}.`, () => {
    shouldThrowErrorOnBadPath(name);
    const test = {
      array: [1, 2, 3],
      object: { one: 1, two: 2, three: 3 },
      string: 'test this!'
    };
    ['array', 'object'].forEach(t => it(`For ${t}s ${name} should ${isEvery ? 'fail at first invalid' : 'succeed at first valid'} iteration`, () => {
      let count = 0;
      const expected = 2;
      const vIt = () => {
        count += 1;
        return count === expected ? failureForEvery() : successForEvery();
      };
      const v = V[name](t, vIt);
      v(test);
      assert(count === expected, ':(');
    }));
    ['array', 'object'].forEach(t => it(`For ${t}s ${name} should ${isEvery ? 'succeed when all iterations are valid' : 'fail when all iterations are invalid'}`, () => {
      let count = 0;
      const expected = 3;
      const vIt = () => { count += 1; return successForEvery(); };
      const v = V[name](t, vIt);
      v(test);
      assert(count === expected, ':(');
    }));
    function iterationChecker(type, expected) {
      it(`For ${type}s ${name} should generate proper iteration objects`, () => {
        const actual = [];
        const vIt = (m) => { actual.push(m); return successForEvery(); };
        const v = V[name](type, vIt);
        v(test);
        assert.deepEqual(actual, expected, ':(');
      });
    }
    iterationChecker('array', test.array.map((v, i,) => ({ index: i, value: v, original: test })));
    iterationChecker('object', Object.keys(test.object).map((k, i) => ({
      index: i, key: k, value: test.object[k], original: test
    })));

    it(`For strings ${name} should fail`, () => {
      const vIt = () => undefined;
      const v = V[name]('string', vIt);
      assert(v(test) !== undefined, ':(');
    });
  });
}

testEveryOrSome('every');

testEveryOrSome('some');
