import { testAllArguments, testValidation, VALIDATION } from '../test-utils';
import { V } from '../../src';

const { SUCCESS, FAILURE } = VALIDATION;

const successExpected = [false, true, 0, 1, {}, []];
const failureExpected = [null];

describe('Test leaf validator isSet$.', () => {
  testAllArguments(V.isSet$, ['']);
  successExpected.forEach(val => testValidation(SUCCESS, { a: val }, V.isSet$, 'a'));
  failureExpected.forEach(val => testValidation(FAILURE, { a: val }, V.isSet$, 'a'));
  testValidation(FAILURE, {}, V.isSet$, 'a');
});
