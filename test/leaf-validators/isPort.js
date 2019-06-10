import { testAllArguments, testValidation, VALIDATION } from '../test-utils';
import { V } from '../../src';

const { SUCCESS, FAILURE } = VALIDATION;

const successExpected = [8080, '8080', 0, '0', 65535, '65535'];
const failureExpected = [-1, '-1', 65536, true, null];

describe('Test leaf validator isPort.', () => {
  testAllArguments(V.isPort, ['a']);
  successExpected.forEach(val => testValidation(SUCCESS, { a: val }, V.isPort, 'a'));
  failureExpected.forEach(val => testValidation(FAILURE, { a: val }, V.isPort, 'a'));
  testValidation(FAILURE, {}, V.isPort, 'a');
});
