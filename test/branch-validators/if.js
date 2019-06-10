import { assert } from 'chai';
import { V, Scope } from '../../src';
import { testAllArguments, testValidation, VALIDATION } from '../test-utils';

const { FAILURE } = VALIDATION;

describe('Test branch validator if.', () => {
  const success = { optIsSet: [''] };
  const failure = { not: [success] };
  const vThen = { onError: ['then', failure] };
  const vElse = { onError: ['else', failure] };
  const args = [success, vThen, vElse];
  testAllArguments(V.if, args);
  testValidation(FAILURE, {}, V.if, success, vThen, vElse);
  it('if(success, then, else) should return then validation result', () => {
    const v = V.if(success, vThen, vElse);
    assert(v(new Scope({})) === 'then', ':(');
  });
  it('if(failure, then, else) should return else validation result', () => {
    const v = V.if(failure, vThen, vElse);
    assert(v(new Scope({})) === 'else', ':(');
  });
  it('if(success, then) should return then validation result', () => {
    const v = V.if(success, vThen);
    assert(v(new Scope({})) === 'then', ':(');
  });
  it('if(failure, then) should be always valid', () => {
    const v = V.if(failure, vThen);
    assert(v(new Scope({})) === undefined, ':(');
  });
  const notBoth = (condStr, condFunc) => it(`if(${condStr}, then, else) should validate either then or else, never both`, () => {
    let count = 0;
    const inc = () => { count += 1; };
    const v = V.if(condFunc, inc, inc);
    v(new Scope({}));
    assert(count === 1, ':(');
  });
  notBoth('success', success);
  notBoth('failure', failure);
});
