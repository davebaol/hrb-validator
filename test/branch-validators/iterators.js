import { assert } from 'chai';
import { shouldThrowErrorOnBadPath, shouldThrowErrorOnBadChild } from '../test-utils';
import V from '../../src';
import U from '../../src/util';

function testEveryOrSome(name) {
  const isEvery = name === 'every';
  const successForEvery = () => (isEvery ? undefined : 'error');
  const failureForEvery = () => (isEvery ? 'error' : undefined);
  describe(`Test branch validator ${name}.`, () => {
    shouldThrowErrorOnBadPath(name);
    shouldThrowErrorOnBadChild(name, ['a'], 1);
    const test = {
      array: [1, 2, 3],
      object: { one: 1, two: 2, three: 3 },
      string: 'test this!'
    };
    const testKeys = Object.keys(test);
    testKeys.forEach(t => it(`For ${t}s ${name} should ${isEvery ? 'fail at first invalid' : 'succeed at first valid'} iteration`, () => {
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
    testKeys.forEach(t => it(`For ${t}s ${name} should ${isEvery ? 'succeed when all iterations are valid' : 'fail when all iterations are invalid'}`, () => {
      let count = 0;
      const expected = U.lengthOf(test[t]);
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
    iterationChecker('string', [...test.string].map((v, i,) => ({ index: i, value: v, original: test })));

    it(`For numbers ${name} should fail`, () => {
      const vIt = () => undefined;
      const v = V[name]('', vIt);
      assert(v(12) !== undefined, ':(');
    });
  });
}

testEveryOrSome('every');

testEveryOrSome('some');
