import { assert } from 'chai';
import { shouldThrowErrorOnBad } from '../test-utils';
import V from '../../src';

const successExpected = [1, '1', true, null];
const failureExpected = [2, '2', false, {}, []];
const successValues = Array.from(successExpected);

function check(val, shouldSucceed) {
  const obj = { a: val };
  it(`isOneOf("a", ${JSON.stringify(successValues)}) should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.isOneOf('a', successValues);
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
    assert(result, ':(');
  });
}

function checkRef(val, shouldSucceed) {
  const obj = { a: val, referenced: successValues };
  const values = { $path: 'referenced' };
  it(`isOneOf("a", ${JSON.stringify(values)}) should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.isOneOf('a', values);
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
    assert(result, ':(');
  });
}

describe('Test leaf validator isOneOf.', () => {
  const args = ['', ['']];
  shouldThrowErrorOnBad('path', 'isOneOf', args, 0);
  shouldThrowErrorOnBad('array', 'isOneOf', args, 1);
  successExpected.forEach(obj => check(obj, true));
  failureExpected.forEach(obj => check(obj, false));
  successExpected.forEach(obj => checkRef(obj, true));
  failureExpected.forEach(obj => checkRef(obj, false));
});
