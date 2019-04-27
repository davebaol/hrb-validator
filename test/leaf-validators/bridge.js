import { assert } from 'chai';
import { shouldThrowErrorOnBadPath } from '../test-utils';
import bridge from '../../src/leaf-validators/bridge';

function testOwnerClass(v, className) {
  it(`Bridged leaf validator ${v.owner.name} is a representative member of ${className}`, () => {
    assert(v.owner.constructor.name === className, ':(');
  });
}

describe('Test bridged leaf validators.', () => {
  const bv = bridge({});

  it('Bridged leaf validators are all functions', () => {
    assert(Object.keys(bv).every(k => typeof bv[k] === 'function'), ':(');
  });

  const owners = ['StringOnly', 'StringAndNumber'];
  it(`Bridged leaf validator owners belong all to [${owners.join(', ')}]`, () => {
    const result = Object.keys(bv).reduce((acc, k) => {
      acc[bv[k].owner.constructor.name] = true;
      return acc;
    }, {});
    assert.hasAllKeys(result, owners, ':(');
  });

  const { contains } = bv;
  testOwnerClass(contains, 'StringOnly');
  shouldThrowErrorOnBadPath('contains');
  it('Bridged leaf validator contains accepts string', () => {
    assert(contains('a', '')({ a: 'string' }) === undefined, ':(');
  });
  it('Bridged leaf validator contains rejects any non-string', () => {
    assert(contains('a', '')({ a: 3 }) !== undefined, ':(');
  });

  const { isInt } = bv;
  testOwnerClass(isInt, 'StringAndNumber');
  shouldThrowErrorOnBadPath('isInt');
  it('Bridged leaf validator isInt accepts string', () => {
    assert(isInt('a')({ a: '3' }) === undefined, ':(');
  });
  it('Bridged leaf validator isInt accepts number', () => {
    assert(isInt('a')({ a: 3 }) === undefined, ':(');
  });
  it('Bridged leaf validator isInt rejects anything other than string or number', () => {
    assert(isInt('a')({ a: true }) !== undefined, ':(');
  });
});
