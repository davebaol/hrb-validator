import { assert } from 'chai';
import V from '../../src';
import { testAllArguments, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE } = VALIDATION;

const successExpected = ['123', [1, 2, 3], { a: 1, b: 2, c: 3 }];
const failureExpected = ['12', [1, 2], { a: 1, b: 2 }, true, null, 123];

function check(val, shouldSucceed) {
  const obj = { a: val };
  testValidation(shouldSucceed ? SUCCESS : FAILURE, obj, V.isLength, 'a', { min: 3, max: 3 });
}

function checkRef(val, shouldSucceed) {
  const obj = { a: val, referenced: 3 };
  const options = { min: { $path: 'referenced' }, max: 3 };
  it(`isLength("a", ${JSON.stringify(options)}) should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.isLength('a', options);
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
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
