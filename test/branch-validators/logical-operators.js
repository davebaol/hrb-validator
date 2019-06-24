import { V } from '../../src';
import { testAllArguments, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE } = VALIDATION;

const success = { optIsSet$: [''] };
const failure = { not: [{ optIsSet$: [''] }] };

describe('Test branch validator not.', () => {
  testAllArguments(V.not, [success]);
  testValidation(SUCCESS, {}, V.not, failure);
  testValidation(FAILURE, {}, V.not, success);
});

describe('Test branch validator and.', () => {
  testAllArguments(V.and, [success, success]);
  testValidation(SUCCESS, {}, V.and, success, success);
  testValidation(FAILURE, {}, V.and, failure, success);
  testValidation(FAILURE, {}, V.and, failure, failure);
  testValidation(FAILURE, {}, V.and, success, failure);
});

describe('Test branch validator or.', () => {
  testAllArguments(V.or, [success, success]);
  testValidation(SUCCESS, {}, V.or, success, success);
  testValidation(SUCCESS, {}, V.or, failure, success);
  testValidation(FAILURE, {}, V.or, failure, failure);
  testValidation(SUCCESS, {}, V.or, success, failure);
});

describe('Test branch validator xor.', () => {
  testAllArguments(V.xor, [success, success]);
  testValidation(FAILURE, {}, V.xor, success, success);
  testValidation(SUCCESS, {}, V.xor, failure, success);
  testValidation(FAILURE, {}, V.xor, failure, failure);
  testValidation(SUCCESS, {}, V.xor, success, failure);
});
