import { assert } from 'chai';
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
  successExpected.forEach(obj => check(obj, true));
  failureExpected.forEach(obj => check(obj, false));
});
