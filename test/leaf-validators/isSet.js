import { testArgument, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE } = VALIDATION;

const successExpected = [false, true, 0, 1, {}, []];
const failureExpected = [null];

describe('Test leaf validator isSet.', () => {
  testArgument('path', 'isSet', [''], 0);
  successExpected.forEach(val => testValidation(SUCCESS, { a: val }, 'isSet', 'a'));
  failureExpected.forEach(val => testValidation(FAILURE, { a: val }, 'isSet', 'a'));
  testValidation(FAILURE, {}, 'isSet', 'a');
});
