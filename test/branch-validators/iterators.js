import { assert } from 'chai';
import lengthOf from '@davebaol/length-of';
import { shouldThrowErrorOnBadPath, shouldThrowErrorOnBadChild } from '../test-utils';
import V from '../../src';

const test = {
  array: [1, 2, 3],
  object: { one: 1, two: 2, three: 3 },
  string: 'test this!'
};
const testKeys = Object.keys(test);

function testEveryOrSome(name) {
  const isEvery = name === 'every';
  const successForEvery = () => (isEvery ? undefined : 'error');
  const failureForEvery = () => (isEvery ? 'error' : undefined);
  describe(`Test branch validator ${name}.`, () => {
    shouldThrowErrorOnBadPath(name);
    shouldThrowErrorOnBadChild(name, ['a'], 1);
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
      const expected = lengthOf(test[t]);
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

    const failureExpected = { numbers: 123, booleans: true };
    Object.keys(failureExpected).forEach(k => it(`For ${k} ${name} should fail`, () => {
      const vIt = () => undefined;
      const v = V[name]('', vIt);
      assert(v(failureExpected[k]) !== undefined, ':(');
    }));
  });
}

testEveryOrSome('every');

testEveryOrSome('some');

describe('Test branch validator while.', () => {
  const success = () => undefined;
  shouldThrowErrorOnBadPath('while');
  shouldThrowErrorOnBadChild('while', ['a', success, success], 1);
  shouldThrowErrorOnBadChild('while', ['a', success, success], 2);

  testKeys.forEach(t => it(`For ${t}s while should fail when the condition fails`, () => {
    const vCond = V.isInt('failed', { min: 0, max: 1 }); // fails on 2nd failure of vDo
    const vDo = V.not(V.optIsSet('value')); // always fail
    const v = V.while(t, vCond, vDo);
    assert(v(test) !== undefined, ':(');
  }));

  testKeys.forEach(t => it(`For ${t}s while should succeed when the condition never fails`, () => {
    const vCond = V.isInt('failed', { min: 0, max: 0 }); // fails on 1st failure of vDo
    const vDo = V.optIsSet('value'); // never fails
    const v = V.while(t, vCond, vDo);
    assert(v(test) === undefined, ':(');
  }));

  function iterationChecker(type, expected) {
    it(`For ${type}s while should generate proper iteration objects`, () => {
      const actual = [];
      const vCond = V.optIsSet(''); // always true
      const vDo = (obj) => { actual.push(Object.assign({}, obj)); return undefined; };
      const v = V.while(type, vCond, vDo);
      v(test);
      assert.deepEqual(actual, expected, ':(');
    });
  }
  iterationChecker('array', test.array.map((v, i,) => ({
    index: i, value: v, succeeded: i, failed: 0, original: test
  })));
  iterationChecker('object', Object.keys(test.object).map((k, i) => ({
    index: i, key: k, value: test.object[k], succeeded: i, failed: 0, original: test
  })));
  iterationChecker('string', [...test.string].map((v, i,) => ({
    index: i, value: v, succeeded: i, failed: 0, original: test
  })));

  const failureExpected = { numbers: 123, booleans: true };
  Object.keys(failureExpected).forEach(k => it(`For ${k} while should fail`, () => {
    const v = V.while('', () => undefined, () => undefined);
    assert(v(failureExpected[k]) !== undefined, ':(');
  }));

  function checkParents(shouldSucceed) {
    it(`Test "No more than two parents" should ${shouldSucceed ? 'succeed' : 'fail'}`, () => {
      const person = {
        relatives: [
          { name: 'a', parent: !shouldSucceed },
          { name: 'b', parent: true },
          { name: 'c', parent: false },
          { name: 'd', parent: true },
          { name: 'e', parent: false }
        ]
      };
      const v = V.while(
        'relatives',
        V.isInt('succeeded', { min: 0, max: 2 }),
        V.equals('value.parent', true)
      );
      assert(shouldSucceed ? (v(person) === undefined) : (v(person) !== undefined), ':(');
    });
  }
  checkParents(true);
  checkParents(false);
});
