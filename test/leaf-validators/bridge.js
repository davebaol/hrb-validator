import { assert } from 'chai';
import { shouldThrowErrorOnBad, shouldThrowErrorOnBadPath } from '../test-utils';
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

  const owners = ['StringOnly', 'StringAndNumber', 'StringAndArray'];
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
  shouldThrowErrorOnBad('string', 'contains', ['a'], 1);
  it('Bridged leaf validator contains accepts string', () => {
    assert(contains('a', '')({ a: 'string' }) === undefined, ':(');
  });
  it('Bridged leaf validator contains rejects any non-string', () => {
    assert(contains('a', '')({ a: 3 }) !== undefined, ':(');
  });

  const { isDivisibleBy } = bv;
  testOwnerClass(isDivisibleBy, 'StringAndNumber');
  shouldThrowErrorOnBadPath('isDivisibleBy');
  shouldThrowErrorOnBad('integer', 'isDivisibleBy', ['a'], 1);
  it('Bridged leaf validator isDivisibleBy accepts string', () => {
    assert(isDivisibleBy('a', 2)({ a: '24' }) === undefined, ':(');
  });
  it('Bridged leaf validator isDivisibleBy accepts number', () => {
    assert(isDivisibleBy('a', 2)({ a: 24 }) === undefined, ':(');
  });
  it('Bridged leaf validator isDivisibleBy rejects anything other than string or number', () => {
    assert(isDivisibleBy('a', 2)({ a: true }) !== undefined, ':(');
  });

  const { isInt } = bv;
  testOwnerClass(isInt, 'StringAndNumber');
  shouldThrowErrorOnBadPath('isInt');
  shouldThrowErrorOnBad('object', 'isInt', ['a'], 1);
  it('Bridged leaf validator isInt accepts string', () => {
    assert(isInt('a')({ a: '3' }) === undefined, ':(');
  });
  it('Bridged leaf validator isInt accepts number', () => {
    assert(isInt('a')({ a: 3 }) === undefined, ':(');
  });
  it('Bridged leaf validator isInt rejects anything other than string or number', () => {
    assert(isInt('a')({ a: true }) !== undefined, ':(');
  });

  const { isFloat } = bv;
  testOwnerClass(isFloat, 'StringAndNumber');
  shouldThrowErrorOnBadPath('isFloat');
  shouldThrowErrorOnBad('object', 'isFloat', ['a'], 1);
  it('Bridged leaf validator isFloat accepts string', () => {
    assert(isFloat('a')({ a: '3' }) === undefined, ':(');
  });
  it('Bridged leaf validator isFloat accepts number', () => {
    assert(isFloat('a')({ a: 3 }) === undefined, ':(');
  });
  it('Bridged leaf validator isFloat rejects anything other than string or number', () => {
    assert(isFloat('a')({ a: true }) !== undefined, ':(');
  });

  const { isLatLong } = bv;
  testOwnerClass(isLatLong, 'StringAndArray');
  shouldThrowErrorOnBadPath('isLatLong');
  it('Bridged leaf validator isLatLong accepts string', () => {
    assert(isLatLong('a')({ a: '+90.0, -127.554334' }) === undefined, ':(');
  });
  it('Bridged leaf validator isLatLong accepts array of two numbers', () => {
    assert(isLatLong('a')({ a: [+90.0, -127.554334] }) === undefined, ':(');
  });
  it('Bridged leaf validator isLatLong accepts array of two strings', () => {
    assert(isLatLong('a')({ a: ['+90.0', '-127.554334'] }) === undefined, ':(');
  });
  it('Bridged leaf validator isLatLong accepts mixed array of a string and a number', () => {
    assert(isLatLong('a')({ a: ['+90.0', -127.554334] }) === undefined, ':(');
  });
  it('Bridged leaf validator isLatLong rejects array not having exactly 2 elements', () => {
    assert(isLatLong('a')({ a: ['+90.0'] }) !== undefined, ':(');
  });
  it('Bridged leaf validator isLatLong rejects array with 2 elements that are not string or number', () => {
    assert(isLatLong('a')({ a: ['+90.0', true] }) !== undefined, ':(');
  });
  it('Bridged leaf validator isLatLong rejects anything other than string or array', () => {
    assert(isLatLong('a')({ a: true }) !== undefined, ':(');
  });
});
