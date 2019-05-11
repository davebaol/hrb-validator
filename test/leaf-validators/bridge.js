import { assert } from 'chai';
import bridge from '../../src/leaf-validators/bridge';
import { testArgument, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE, THROW } = VALIDATION;

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
  testValidation(SUCCESS, { a: 'string' }, contains, 'a', '');
  testValidation(FAILURE, { a: 3 }, contains, 'a', '');
  testValidation([THROW, FAILURE], { a: 3 }, contains, 'a', 123);

  const { isDivisibleBy } = bv;
  testOwnerClass(isDivisibleBy, 'StringAndNumber');
  testAllArguments(isDivisibleBy, ['a', 2]);
  testValidation(SUCCESS, { a: '24' }, isDivisibleBy, 'a', 2);
  testValidation(SUCCESS, { a: 24 }, isDivisibleBy, 'a', 2);
  testValidation(FAILURE, { a: true }, isDivisibleBy, 'a', 2);
  testValidation([THROW, FAILURE], { a: 3 }, isDivisibleBy, 'a', true);

  const { isInt } = bv;
  testOwnerClass(isInt, 'StringAndNumber');
  testAllArguments(isInt, ['a', {}]);
  testValidation(SUCCESS, { a: '3' }, isInt, 'a');
  testValidation(SUCCESS, { a: 3 }, isInt, 'a');
  testValidation(FAILURE, { a: true }, isInt, 'a');
  testValidation([THROW, FAILURE], { a: 3 }, isInt, 'a', true);

  const { isFloat } = bv;
  testOwnerClass(isFloat, 'StringAndNumber');
  testAllArguments(isFloat, ['a', {}]);
  testValidation(SUCCESS, { a: '3' }, isFloat, 'a');
  testValidation(SUCCESS, { a: 3 }, isFloat, 'a');
  testValidation(FAILURE, { a: true }, isFloat, 'a');
  testValidation([THROW, FAILURE], { a: 3 }, isFloat, 'a', true);

  const { isLatLong } = bv;
  testOwnerClass(isLatLong, 'StringAndArray');
  testAllArguments(isLatLong, ['']);
  testValidation(SUCCESS, { a: '+90.0, -127.554334' }, isLatLong, 'a');
  testValidation(SUCCESS, { a: [+90.0, -127.554334] }, isLatLong, 'a');
  testValidation(SUCCESS, { a: ['+90.0', '-127.554334'] }, isLatLong, 'a');
  testValidation(SUCCESS, { a: ['+90.0', -127.554334] }, isLatLong, 'a');
  testValidation(FAILURE, { a: ['+90.0'] }, isLatLong, 'a');
  testValidation(FAILURE, { a: ['+90.0', true] }, isLatLong, 'a');
  testValidation(FAILURE, { a: true }, isLatLong, 'a');
});
