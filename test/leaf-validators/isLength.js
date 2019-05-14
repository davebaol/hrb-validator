import { assert } from 'chai';
import { testAllArguments } from '../test-utils';
import V from '../../src';

const successExpected = ['123', [1, 2, 3], { a: 1, b: 2, c: 3 }];
const failureExpected = ['12', [1, 2], { a: 1, b: 2 }, true, null, 123];

function check(val, shouldSucceed) {
  const obj = { a: val };
  it(`isLength("a", {min:3, max:3}) should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.isLength('a', { min: 3, max: 3 });
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
    assert(result, ':(');
  });
}

function checkRef(val, shouldSucceed) {
  const obj = { a: val, referenced: 3 };
  const options = { min: { $path: 'referenced' }, max: 3 };
  it(`isLength("a", ${JSON.stringify(options)}) should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.isLength('a', options);
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
    if (shouldSucceed && !result) {
      console.log(v(obj)); // eslint-disable-line no-console
    }
    assert(result, ':(');
  });
}

describe('Test leaf validator isLength.', () => {
  const args = ['', {}];
  testAllArguments(V.isLength, args);
  successExpected.forEach(obj => check(obj, true));
  failureExpected.forEach(obj => check(obj, false));
  successExpected.forEach(obj => checkRef(obj, true));
  failureExpected.forEach(obj => checkRef(obj, false));
});
