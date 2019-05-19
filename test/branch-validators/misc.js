import { assert } from 'chai';
import V from '../../src';
import { testAllArguments, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS } = VALIDATION;

const success = { optIsSet: [''] };
const failure = { not: [success] };

describe('Test branch validator alter.', () => {
  testAllArguments(V.alter, [success, '', '']);
  testValidation(SUCCESS, {}, V.alter, success, null, 'error');
  testValidation(SUCCESS, {}, V.alter, failure, 'error', null);
  it('alter(success, "OK", "KO") should return "OK"', () => {
    const v = V.alter(success, 'OK', 'KO');
    assert(v({}) === 'OK', ':(');
  });
  it('alter(failure, "OK", "KO") should return "KO"', () => {
    const v = V.alter(failure, 'OK', 'KO');
    assert(v({}) === 'KO', ':(');
  });
});

describe('Test branch validator onError.', () => {
  testAllArguments(V.onError, [success, 'error']);
  testValidation(SUCCESS, {}, V.onError, failure, null);
  it('onError("success, error") should succeed', () => {
    const v = V.onError(success, 'error');
    assert(v({}) === undefined, ':(');
  });
  it('onError(failure, "error") should fail with "error"', () => {
    const v = V.onError(failure, 'error');
    assert(v({}) === 'error', ':(');
  });
});
