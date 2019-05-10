import { testArgument, testValidation } from '../test-utils';

describe('Test leaf validator isType.', () => {
  const args = ['', 'string'];
  testArgument('path', 'isType', args, 0);
  testArgument('type', 'isType', args, 1);
  testValidation(true, { a: '' }, 'isType', [], 'object');
  testValidation(true, { a: '' }, 'isType', '', 'object');
  testValidation(true, { a: false }, 'isType', 'a', 'boolean');
  testValidation(true, { a: true }, 'isType', 'a', 'boolean');
  testValidation(false, { a: null }, 'isType', 'a', 'boolean');
  testValidation(true, { a: false }, 'isType', 'a', ['boolean', 'array']);
  testValidation(true, { a: [] }, 'isType', 'a', ['boolean', 'array']);
  testValidation(false, { a: '...' }, 'isType', 'a', ['boolean', 'array']);
});

describe('Test leaf validator isArrayOf.', () => {
  const args = ['', 'string'];
  testArgument('path', 'isArrayOf', args, 0);
  testArgument('type', 'isArrayOf', args, 1);
  testValidation(true, [false], 'isArrayOf', [], 'boolean');
  testValidation(true, [false], 'isArrayOf', '', 'boolean');
  testValidation(true, { a: [false] }, 'isArrayOf', 'a', 'boolean');
  testValidation(false, { a: [false, 'true'] }, 'isArrayOf', 'a', 'boolean');
  testValidation(true, { a: [false, 'true'] }, 'isArrayOf', 'a', ['boolean', 'string']);
  testValidation(false, { a: [false, 'true', 0] }, 'isArrayOf', 'a', ['boolean', 'string']);
});
