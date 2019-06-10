import { testAllArguments, testValidation, VALIDATION } from '../test-utils';
import { V } from '../../src';

const { SUCCESS, FAILURE, THROW } = VALIDATION;

const successExpected = [1, '1', true, null];
const failureExpected = [2, '2', false, {}, []];
const successValues = Array.from(successExpected);

describe('Test leaf validator isOneOf.', () => {
  const args = ['', ['']];
  testAllArguments(V.isOneOf, args);
  successExpected.forEach(val => testValidation(SUCCESS, { a: val }, V.isOneOf, 'a', successValues));
  failureExpected.forEach(val => testValidation(FAILURE, { a: val }, V.isOneOf, 'a', successValues));
  testValidation([THROW, FAILURE], { a: 'x' }, V.isOneOf, 'a', 'not an array');
});
