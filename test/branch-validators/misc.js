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
  testAllArguments(V.onError, ['error', success]);
  it('onError("error", success) should succeed', () => {
    const v = V.onError('error', success);
    assert(v({}) === undefined, ':(');
  });
  it('onError("error", failure) should fail with "error"', () => {
    const v = V.onError('error', failure);
    assert(v({}) === 'error', ':(');
  });
});
