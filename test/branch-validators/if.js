import { assert } from 'chai';
import { testArgument } from '../test-utils';
import V from '../../src';

describe('Test branch validator if.', () => {
  const success = () => undefined;
  const failure = () => 'failure';
  const vThen = () => 'then';
  const vElse = () => 'else';
  const args = [success, vThen, vElse];
  args.forEach((a, i) => testArgument('child', 'if', args, i));
  it('if(success, then, else) should return then validation result', () => {
    const v = V.if(success, vThen, vElse);
    assert(v({}) === 'then', ':(');
  });
  it('if(failure, then, else) should return else validation result', () => {
    const v = V.if(failure, vThen, vElse);
    assert(v({}) === 'else', ':(');
  });
  it('if(success, then) should return then validation result', () => {
    const v = V.if(success, vThen);
    assert(v({}) === 'then', ':(');
  });
  it('if(failure, then) should be always valid', () => {
    const v = V.if(failure, vThen);
    assert(v({}) === undefined, ':(');
  });
  const notBoth = (condStr, condFunc) => it(`if(${condStr}, then, else) should validate either then or else, never both`, () => {
    let count = 0;
    const inc = () => { count += 1; };
    const v = V.if(condFunc, inc, inc);
    v({});
    assert(count === 1, ':(');
  });
  notBoth('success', success);
  notBoth('failure', failure);
});
