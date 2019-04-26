import { assert } from 'chai';
import { shouldThrowErrorOnBad, shouldThrowErrorOnBadPath } from '../test-utils';
import V from '../../src';

function check(obj, options, shouldSucceed) {
  it(`isPort("a", ${JSON.stringify(options)}) should ${shouldSucceed ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.isPort('a', options);
    const result = shouldSucceed ? v(obj) === undefined : v(obj) !== undefined;
    assert(result, ':(');
  });
}

describe('Test leaf validator isPort.', () => {
  shouldThrowErrorOnBadPath('isPort');
  shouldThrowErrorOnBad('object', 'isPort', [''], 1);
  it('Should throw immediately an error on inconsistent options', () => {
    assert.throws(() => V.isPort('', { asNumber: false, asString: false }), Error);
  });
  check({ a: 8080 }, undefined, true);
  check({ a: 8080 }, { asNumber: true }, true);
  check({ a: 8080 }, { asNumber: false }, false);
  check({ a: '8080' }, undefined, true);
  check({ a: '8080' }, { asString: true }, true);
  check({ a: '8080' }, { asString: false }, false);
  check({ a: {} }, {}, false);
});
