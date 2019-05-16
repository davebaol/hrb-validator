import { assert } from 'chai';
import { testAllArguments } from '../test-utils';
import V from '../../src';

const success = V.optIsSet('');
const failure = V.not(success);

// TODO Use testValidation()
describe('Test branch validator alter.', () => {
  testAllArguments(V.alter, [success, '', '']);
  it('alter(success, "OK", "KO") should return "OK"', () => {
    const v = V.alter(success, 'OK', 'KO');
    assert(v({}) === 'OK', ':(');
  });
  it('alter(failure, "OK", "KO") should return "KO"', () => {
    const v = V.alter(failure, 'OK', 'KO');
    assert(v({}) === 'KO', ':(');
  });
});

// TODO Use testValidation()
describe('Test branch validator onError.', () => {
  testAllArguments(V.onError, [success, 'error']);
  it('onError("success, error") should succeed', () => {
    const v = V.onError(success, 'error');
    assert(v({}) === undefined, ':(');
  });
  it('onError(failure, "error") should fail with "error"', () => {
    const v = V.onError(failure, 'error');
    assert(v({}) === 'error', ':(');
  });
});
