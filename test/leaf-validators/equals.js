import { assert } from 'chai';
import { shouldThrowErrorOnBad } from '../test-utils';
import V from '../../src';

const successExpected = [[false, false], [0, 0], ['foo', 'foo']];
const failureExpected = [[false, true], [0, 1], ['foo', 'bar'], [{}, {}], [[], []]];

function check(pair, shouldSucceed) {
  const obj = { a: pair[0] };
  const comparison = pair[1];
  it(`equals("a", ${JSON.stringify(comparison)}) should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.equals('a', comparison);
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
    assert(result, ':(');
  });
}

function checkRef(pair, shouldSucceed) {
  const obj = { a: pair[0], referenced: pair[1] };
  const comparison = { $path: 'referenced' };
  it(`equals("a", ${JSON.stringify(comparison)}) should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.equals('a', comparison);
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
    assert(result, ':(');
  });
}

describe('Test leaf validator equals.', () => {
  shouldThrowErrorOnBad('path', 'equals', ['', 2], 0);
  successExpected.forEach(obj => check(obj, true));
  failureExpected.forEach(obj => check(obj, false));
  successExpected.forEach(obj => checkRef(obj, true));
  failureExpected.forEach(obj => checkRef(obj, false));
});
