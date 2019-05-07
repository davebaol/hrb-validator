import { assert } from 'chai';
import { shouldThrowErrorOnBad } from '../test-utils';
import V from '../../src';

const successExpected = [false, true, 0, 1, {}, []].map(v => ({ a: v }));
const failureExpected = [{ a: null }, {}];

function check(obj, shouldSucceed) {
  it(`isSet("a") should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.isSet('a');
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
    assert(result, ':(');
  });
}

describe('Test leaf validator isSet.', () => {
  shouldThrowErrorOnBad('path', 'isSet', [''], 0);
  successExpected.forEach(obj => check(obj, true));
  failureExpected.forEach(obj => check(obj, false));
});
