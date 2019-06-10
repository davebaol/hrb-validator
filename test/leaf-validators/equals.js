import { assert } from 'chai';
import { testAllArguments, testValidation, VALIDATION } from '../test-utils';
import V from '../../src';
import Scope from '../../src/util/scope';

const { SUCCESS, FAILURE } = VALIDATION;

const successExpected = [[false, false], [0, 0], ['foo', 'foo']];
const failureExpected = [[false, true], [0, 1], ['foo', 'bar'], [{}, {}], [[], []]];

describe('Test leaf validator equals.', () => {
  testAllArguments(V.equals, ['', 2, false]);
  successExpected.forEach(pair => testValidation(SUCCESS, { a: pair[0] }, V.equals, 'a', pair[1]));
  failureExpected.forEach(pair => testValidation(FAILURE, { a: pair[0] }, V.equals, 'a', pair[1]));

  // Deep equal
  [null, undefined].forEach(b => it(`Deep equal should ${b === null ? 'fail' : 'succeed'}`, () => {
    const obj1 = { a: 'hello', b: [undefined, { x: true }] };
    const obj2 = { a: 'hello', b: [b, { x: true }] };
    const v = V.equals('', obj1, true);
    const result = v(new Scope(obj2));
    assert(b === null ? result !== undefined : result === undefined, ':(');
  }));

  // Deep equal with reference
  it('Deep equal with reference should succeed', () => {
    const obj1 = { a: 'hello' };
    const obj2 = { a: 'hello' };
    const v = V.def({ deep: true }, V.equals('', obj1, { $var: 'deep' }));
    assert(v(new Scope(obj2)) === undefined, ':(');
  });
});
