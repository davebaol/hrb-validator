import { assert } from 'chai';
import { shouldThrowErrorOnBadPath, shouldThrowErrorOnBad } from '../test-utils';
import V from '../../src';

const successExpected = ['123', [1, 2, 3], { a: 1, b: 2, c: 3 }].map(v => ({ a: v }));
const failureExpected = ['12', [1, 2], { a: 1, b: 2 }, true, null, 123].map(v => ({ a: v }));

function check(obj, shouldSucceed) {
  it(`isLength("a", {min:3, max:3}) should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.isLength('a', { min: 3, max: 3 });
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
    assert(result, ':(');
  });
}

describe('Test leaf validator isLength.', () => {
  shouldThrowErrorOnBadPath('isLength');
  shouldThrowErrorOnBad('object', 'isLength', [''], 1);
  successExpected.forEach(obj => check(obj, true));
  failureExpected.forEach(obj => check(obj, false));
});
