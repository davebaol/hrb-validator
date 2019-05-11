import { testArgument, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE } = VALIDATION;

const successExpected = [8080, '8080', 0, '0', 65535, '65535'];
const failureExpected = [-1, '-1', 65536, true, null];

describe('Test leaf validator isPort.', () => {
  testArgument('path', 'isPort', ['2'], 0);
  successExpected.forEach(val => testValidation(SUCCESS, { a: val }, 'isPort', 'a'));
  failureExpected.forEach(val => testValidation(FAILURE, { a: val }, 'isPort', 'a'));
  testValidation(FAILURE, {}, 'isPort', 'a');
});
