import { assert } from 'chai';
import { shouldThrowErrorOnBad, shouldThrowErrorOnBadPath } from '../test-utils';
import V from '../../src';

const successValues = [1, '1', true, null];
const successExpected = successValues.map(v => ({ a: v }));
const failureExpected = [2, '2', false, {}, []].map(v => ({ a: v }));

function check(obj, shouldSucceed) {
  it(`isOneOf("a", ${JSON.stringify(successValues)}) should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.isOneOf('a', successValues);
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
    assert(result, ':(');
  });
}

describe('Test leaf validator isOneOf.', () => {
  shouldThrowErrorOnBadPath('isOneOf');
  shouldThrowErrorOnBad('array', 'isOneOf', [''], 1);
  successExpected.forEach(obj => check(obj, true));
  failureExpected.forEach(obj => check(obj, false));
});
