import { assert } from 'chai';
import V from '../../src';

describe('Test branch validator if.', () => {
  function testExceptionOnArg(i) {
    const d = [
      { s: 'cond', v: () => undefined },
      { s: 'then', v: () => undefined },
      { s: 'else', v: () => undefined },
    ];
    d[i] = { s: '"not a validator"', v: 'not a validator' };
    it(`if(${d[0].s}, ${d[1].s}, ${d[2].s}) should throw an error immediately`, () => {
      assert.throws(() => V.if(d[0].v, d[1].v, d[2].v), Error);
    });
  }
  testExceptionOnArg(0);
  testExceptionOnArg(1);
  testExceptionOnArg(2);

  const success = () => undefined;
  const failure = () => 'failure';
  const vThen = () => 'then';
  const vElse = () => 'else';
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
