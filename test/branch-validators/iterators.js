import { assert } from 'chai';
import lengthOf from '@davebaol/length-of';
import { V, Scope } from '../../src';
import { testAllArguments, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE } = VALIDATION;

const test = {
  array: [1, 2, 3],
  object: { one: 1, two: 2, three: 3 },
  string: 'test this!'
};
const testKeys = Object.keys(test);

function testEveryOrSome(name) {
  const isEvery = name === 'every$';
  const successForEvery = () => (isEvery ? undefined : 'error');
  const failureForEvery = () => (isEvery ? 'error' : undefined);
  describe(`Test branch validator ${name}.`, () => {
    const everyOrSome = V[name];
    const args = ['a', V.isSet$('')];
    testAllArguments(everyOrSome, args);
    testValidation(SUCCESS, test.array, everyOrSome, '', { optIsSet$: ['value'] });
    testKeys.forEach(t => it(`For ${t}s ${name} should ${isEvery ? 'fail at first invalid' : 'succeed at first valid'} iteration`, () => {
      let count = 0;
      const expected = 2;
      const vIt = () => {
        count += 1;
        return count === expected ? failureForEvery() : successForEvery();
      };
      const v = everyOrSome(t, vIt);
      v(new Scope(test));
      assert(count === expected, ':(');
    }));
    testKeys.forEach(t => it(`For ${t}s ${name} should ${isEvery ? 'succeed when all iterations are valid' : 'fail when all iterations are invalid'}`, () => {
      let count = 0;
      const expected = lengthOf(test[t]);
      const vIt = () => { count += 1; return successForEvery(); };
      const v = everyOrSome(t, vIt);
      v(new Scope(test));
      assert(count === expected, ':(');
    }));
    function iterationChecker(type, expected) {
      it(`For ${type}s ${name} should generate proper iteration objects`, () => {
        const actual = [];
        const vIt = (scope) => { actual.push(Object.assign({}, scope.find('$'))); return successForEvery(); };
        const v = everyOrSome(type, vIt);
        v(new Scope(test));
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
      const v = everyOrSome('', vIt);
      assert(v(new Scope(failureExpected[k])) !== undefined, ':(');
    }));
  });
}

testEveryOrSome('every$');

testEveryOrSome('some$');

describe('Test branch validator while$.', () => {
  const args = ['a', () => undefined, () => undefined];
  testAllArguments(V.while$, args);

  testKeys.forEach((t) => {
    // Should fail when the condition fails
    const vCond = { isInt$: ['failed', { min: 0, max: 1 }] }; // fails on 2nd failure of vDo
    const vDo = { not: [{ optIsSet$: ['value'] }] }; // always fails
    testValidation(FAILURE, test, V.while$, t, vCond, vDo);
  });

  testKeys.forEach((t) => {
    // Should succeed when the condition never fails`, () => {
    const vCond = { isInt$: ['failed', { min: 0, max: 0 }] }; // fails on 1st failure of vDo
    const vDo = { optIsSet$: ['value'] }; // never fails
    testValidation(SUCCESS, test, V.while$, t, vCond, vDo);
  });

  function iterationChecker(type, expected) {
    it(`For ${type}s while should generate proper iteration objects`, () => {
      const actual = [];
      const vCond = V.optIsSet$(''); // always true
      const vDo = (scope) => { actual.push(Object.assign({}, scope.find('$'))); return undefined; };
      const v = V.while$(type, vCond, vDo);
      v(new Scope(test));
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
  Object.keys(failureExpected).forEach(k => it(`For ${k} while$ should fail`, () => {
    const v = V.while$('', () => undefined, () => undefined);
    assert(v(new Scope(failureExpected[k])) !== undefined, ':(');
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
      const v = V.while$(
        'relatives',
        V.isInt$('succeeded', { min: 0, max: 2 }),
        V.equals$('value.parent', true)
      );
      const result = v(new Scope(person));
      assert(shouldSucceed ? result === undefined : result !== undefined, ':(');
    });
  }
  checkParents(true);
  checkParents(false);
});
