import { assert } from 'chai';
import V from '../../src';

const success = () => undefined;
const failure = () => 'failure';

describe('Test branch validator alter.', () => {
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
  it('onError("error", success) should succeed', () => {
    const v = V.onError('error', success);
    assert(v({}) === undefined, ':(');
  });
  it('onError("error", failure) should fail', () => {
    const v = V.onError('error', failure);
    assert(v({}) === 'error', ':(');
  });
});
