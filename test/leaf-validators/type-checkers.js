import { testAllArguments, testValidation, VALIDATION } from '../test-utils';
import { V } from '../../src';

const { SUCCESS, FAILURE, THROW } = VALIDATION;

describe('Test leaf validator isType$.', () => {
  const args = ['', 'string'];
  testAllArguments(V.isType$, args);
  testValidation(SUCCESS, { a: '' }, V.isType$, [], 'object');
  testValidation(SUCCESS, { a: '' }, V.isType$, '', 'object');
  testValidation(SUCCESS, { a: false }, V.isType$, 'a', 'boolean');
  testValidation(SUCCESS, { a: true }, V.isType$, 'a', 'boolean');
  testValidation(FAILURE, { a: null }, V.isType$, 'a', 'regex'); // take the opportunity to test regex type too
  testValidation([THROW, FAILURE], { a: '...' }, V.isType$, 'a', 'unknown_type');
  testValidation(SUCCESS, { a: false }, V.isType$, 'a', ['boolean', 'array']);
  testValidation(SUCCESS, { a: [] }, V.isType$, 'a', ['boolean', 'array']);
  testValidation(FAILURE, { a: '...' }, V.isType$, 'a', ['boolean', 'array']);
  testValidation([THROW, FAILURE], { a: '...' }, V.isType$, 'a', ['unknown_type', 'array']);
});

describe('Test leaf validator isArrayOf$.', () => {
  const args = ['', 'string'];
  testAllArguments(V.isArrayOf$, args);
  testValidation(SUCCESS, [false], V.isArrayOf$, [], 'boolean');
  testValidation(SUCCESS, [false], V.isArrayOf$, '', 'boolean');
  testValidation(SUCCESS, { a: [false] }, V.isArrayOf$, 'a', 'boolean');
  testValidation(FAILURE, { a: [false, 'true'] }, V.isArrayOf$, 'a', 'boolean');
  testValidation([THROW, FAILURE], { a: [] }, V.isArrayOf$, 'a', 'unknown_type');
  testValidation([FAILURE], { a: '...' }, V.isArrayOf$, 'a', 'boolean');
  testValidation(SUCCESS, { a: [false, 'true'] }, V.isArrayOf$, 'a', ['boolean', 'string']);
  testValidation(FAILURE, { a: [false, 'true', 0] }, V.isArrayOf$, 'a', ['boolean', 'string']);
  testValidation([THROW, FAILURE], { a: [] }, V.isArrayOf$, 'a', ['unknown_type', 'string']);
  testValidation([FAILURE], { a: '...' }, V.isArrayOf$, 'a', ['boolean', 'string']);
});
