import { assert } from 'chai';
import { V, Scope } from '../../src';
import { testAllArguments, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS } = VALIDATION;

const success = { optIsSet: [''] };
const failure = { not: [success] };

describe('Test branch validator alter.', () => {
  testAllArguments(V.alter, ['', '', success]);
  testValidation(SUCCESS, {}, V.alter, null, 'error', success);
  testValidation(SUCCESS, {}, V.alter, 'error', null, failure);
  it('alter(success, "OK", "KO") should return "OK"', () => {
    const v = V.alter('OK', 'KO', success);
    assert(v(new Scope({})) === 'OK', ':(');
  });
  it('alter(failure, "OK", "KO") should return "KO"', () => {
    const v = V.alter('OK', 'KO', failure);
    assert(v(new Scope({})) === 'KO', ':(');
  });
});

describe('Test branch validator onError.', () => {
  testAllArguments(V.onError, ['error', success]);
  testValidation(SUCCESS, {}, V.onError, null, failure);
  it('onError("success, error") should succeed', () => {
    const v = V.onError('error', success);
    assert(v(new Scope({})) === undefined, ':(');
  });
  it('onError(failure, "error") should fail with "error"', () => {
    const v = V.onError('error', failure);
    assert(v(new Scope({})) === 'error', ':(');
  });
});
