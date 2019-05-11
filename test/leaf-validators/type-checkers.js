import { testArgument, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE, THROW } = VALIDATION;

describe('Test leaf validator isType.', () => {
  const args = ['', 'string'];
  testArgument('path', 'isType', args, 0);
  testArgument('type', 'isType', args, 1);
  testValidation(SUCCESS, { a: '' }, 'isType', [], 'object');
  testValidation(SUCCESS, { a: '' }, 'isType', '', 'object');
  testValidation(SUCCESS, { a: false }, 'isType', 'a', 'boolean');
  testValidation(SUCCESS, { a: true }, 'isType', 'a', 'boolean');
  testValidation(FAILURE, { a: null }, 'isType', 'a', 'boolean');
  testValidation([THROW, FAILURE], { a: '...' }, 'isType', 'a', 'unknown_type');
  testValidation(SUCCESS, { a: false }, 'isType', 'a', ['boolean', 'array']);
  testValidation(SUCCESS, { a: [] }, 'isType', 'a', ['boolean', 'array']);
  testValidation(FAILURE, { a: '...' }, 'isType', 'a', ['boolean', 'array']);
  testValidation([THROW, FAILURE], { a: '...' }, 'isType', 'a', ['unknown_type', 'array']);
});

describe('Test leaf validator isArrayOf.', () => {
  const args = ['', 'string'];
  testArgument('path', 'isArrayOf', args, 0);
  testArgument('type', 'isArrayOf', args, 1);
  testValidation(SUCCESS, [false], 'isArrayOf', [], 'boolean');
  testValidation(SUCCESS, [false], 'isArrayOf', '', 'boolean');
  testValidation(SUCCESS, { a: [false] }, 'isArrayOf', 'a', 'boolean');
  testValidation(FAILURE, { a: [false, 'true'] }, 'isArrayOf', 'a', 'boolean');
  testValidation([THROW, FAILURE], { a: '...' }, 'isArrayOf', 'a', 'unknown_type');
  testValidation(SUCCESS, { a: [false, 'true'] }, 'isArrayOf', 'a', ['boolean', 'string']);
  testValidation(FAILURE, { a: [false, 'true', 0] }, 'isArrayOf', 'a', ['boolean', 'string']);
  testValidation([THROW, FAILURE], { a: '...' }, 'isArrayOf', 'a', ['unknown_type', 'string']);
});
