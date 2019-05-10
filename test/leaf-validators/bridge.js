import { assert } from 'chai';
import { testArgument, testValidation } from '../test-utils';
import bridge from '../../src/leaf-validators/bridge';

function testOwnerClass(v, className) {
  it(`Bridged leaf validator ${v.owner.name} is a representative member of ${className}`, () => {
    assert(v.owner.constructor.name === className, ':(');
  });
}

function testAllArguments(v, args) {
  const vName = v.owner.name;
  testArgument('path', vName, args, 0);
  v.owner.argDescriptors.forEach((ad, i) => {
    testArgument(ad.type, vName, args, i + 1);
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
  testAllArguments(contains, ['a', 'seed']);
  testValidation(true, { a: 'string' }, contains, 'a', '');
  testValidation(false, { a: 3 }, contains, 'a', '');

  const { isDivisibleBy } = bv;
  testOwnerClass(isDivisibleBy, 'StringAndNumber');
  testAllArguments(isDivisibleBy, ['a', 2]);
  testValidation(true, { a: '24' }, isDivisibleBy, 'a', 2);
  testValidation(true, { a: 24 }, isDivisibleBy, 'a', 2);
  testValidation(false, { a: true }, isDivisibleBy, 'a', 2);

  const { isInt } = bv;
  testOwnerClass(isInt, 'StringAndNumber');
  testAllArguments(isInt, ['a', {}]);
  testValidation(true, { a: '3' }, isInt, 'a');
  testValidation(true, { a: 3 }, isInt, 'a');
  testValidation(false, { a: true }, isInt, 'a');

  const { isFloat } = bv;
  testOwnerClass(isFloat, 'StringAndNumber');
  testAllArguments(isFloat, ['a', {}]);
  testValidation(true, { a: '3' }, isFloat, 'a');
  testValidation(true, { a: 3 }, isFloat, 'a');
  testValidation(false, { a: true }, isFloat, 'a');

  const { isLatLong } = bv;
  testOwnerClass(isLatLong, 'StringAndArray');
  testAllArguments(isLatLong, ['']);
  testValidation(true, { a: '+90.0, -127.554334' }, isLatLong, 'a');
  testValidation(true, { a: [+90.0, -127.554334] }, isLatLong, 'a');
  testValidation(true, { a: ['+90.0', '-127.554334'] }, isLatLong, 'a');
  testValidation(true, { a: ['+90.0', -127.554334] }, isLatLong, 'a');
  testValidation(false, { a: ['+90.0'] }, isLatLong, 'a');
  testValidation(false, { a: ['+90.0', true] }, isLatLong, 'a');
  testValidation(false, { a: true }, isLatLong, 'a');
});
