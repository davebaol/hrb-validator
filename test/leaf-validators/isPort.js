import { assert } from 'chai';
import { shouldThrowErrorOnBad } from '../test-utils';
import V from '../../src';

const successExpected = [8080, '8080', 0, '0', 65535, '65535'].map(v => ({ a: v }));
const failureExpected = [-1, '-1', 65536, true, null].map(v => ({ a: v }));

function check(obj, shouldSucceed) {
  it(`isPort("a") should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.isPort('a');
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
    assert(result, ':(');
  });
}

describe('Test leaf validator isPort.', () => {
  shouldThrowErrorOnBad('path', 'isPort', ['2'], 0);
  successExpected.forEach(obj => check(obj, true));
  failureExpected.forEach(obj => check(obj, false));
  check({}, false);
});
