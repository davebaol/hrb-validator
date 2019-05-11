import { testArgument, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE, THROW } = VALIDATION;

const successExpected = [1, '1', true, null];
const failureExpected = [2, '2', false, {}, []];
const successValues = Array.from(successExpected);

describe('Test leaf validator isOneOf.', () => {
  const args = ['', ['']];
  testArgument('path', 'isOneOf', args, 0);
  testArgument('array', 'isOneOf', args, 1);
  successExpected.forEach(val => testValidation(SUCCESS, { a: val }, 'isOneOf', 'a', successValues));
  failureExpected.forEach(val => testValidation(FAILURE, { a: val }, 'isOneOf', 'a', successValues));
  testValidation([THROW, FAILURE], { a: 'x' }, 'isOneOf', 'a', 'not an array');
});
