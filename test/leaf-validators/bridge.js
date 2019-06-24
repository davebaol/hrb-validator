import { assert } from 'chai';
import bridge from '../../src/leaf-validators/bridge';
import { testAllArguments, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE, THROW } = VALIDATION;

function testOwnerClass(v, className) {
  it(`Bridged leaf validator ${v.info.name} should be a representative member of ${className}`, () => {
    assert(v.info.constructor.name === className, ':(');
  });
}

describe('Test bridged leaf validators.', () => {
  const bv = bridge({});

  it('Bridged leaf validators should be all functions', () => {
    assert(Object.keys(bv).every(k => typeof bv[k] === 'function'), ':(');
  });

  const infoList = ['StringOnly', 'StringOrNumber', 'StringOrArray'];
  it(`Info of all non-shortcut bridged leaf validators should belong to [${infoList.join(', ')}]`, () => {
    const result = Object.keys(bv).reduce((acc, k) => {
      const infoCtorName = bv[k].info.constructor.name;
      if (!k.startsWith('opt') || infoCtorName !== 'Info') { // skip opt shortcut
        acc[bv[k].info.constructor.name] = true;
      }
      return acc;
    }, {});
    assert.hasAllKeys(result, infoList, ':(');
  });

  // Test matches$ to test regex type too
  const { matches$ } = bv;
  testOwnerClass(matches$, 'StringOnly');
  testAllArguments(matches$, ['a', '.*']);
  testValidation(SUCCESS, { a: 'string' }, matches$, 'a', '.*', 'i');
  testValidation(FAILURE, { a: 3 }, matches$, 'a', '.*');
  testValidation([THROW, FAILURE], { a: 'string' }, matches$, 'a', 123);

  const { isDivisibleBy$ } = bv;
  testOwnerClass(isDivisibleBy$, 'StringOrNumber');
  testAllArguments(isDivisibleBy$, ['a', 2]);
  testValidation(SUCCESS, { a: '24' }, isDivisibleBy$, 'a', 2);
  testValidation(SUCCESS, { a: 24 }, isDivisibleBy$, 'a', 2);
  testValidation(FAILURE, { a: true }, isDivisibleBy$, 'a', 2);
  testValidation([THROW, FAILURE], { a: 3 }, isDivisibleBy$, 'a', true);

  const { isInt$ } = bv;
  testOwnerClass(isInt$, 'StringOrNumber');
  testAllArguments(isInt$, ['a', {}]);
  testValidation(SUCCESS, { a: '3' }, isInt$, 'a');
  testValidation(SUCCESS, { a: 3 }, isInt$, 'a');
  testValidation(FAILURE, { a: true }, isInt$, 'a');
  testValidation([THROW, FAILURE], { a: 3 }, isInt$, 'a', true);

  const { isFloat$ } = bv;
  testOwnerClass(isFloat$, 'StringOrNumber');
  testAllArguments(isFloat$, ['a', {}]);
  testValidation(SUCCESS, { a: '3' }, isFloat$, 'a');
  testValidation(SUCCESS, { a: 3 }, isFloat$, 'a');
  testValidation(FAILURE, { a: true }, isFloat$, 'a');
  testValidation([THROW, FAILURE], { a: 3 }, isFloat$, 'a', true);

  const { isLatLong$ } = bv;
  testOwnerClass(isLatLong$, 'StringOrArray');
  testAllArguments(isLatLong$, ['']);
  testValidation(SUCCESS, { a: '+90.0, -127.554334' }, isLatLong$, 'a');
  testValidation(SUCCESS, { a: [+90.0, -127.554334] }, isLatLong$, 'a');
  testValidation(SUCCESS, { a: ['+90.0', '-127.554334'] }, isLatLong$, 'a');
  testValidation(SUCCESS, { a: ['+90.0', -127.554334] }, isLatLong$, 'a');
  testValidation(FAILURE, { a: ['+90.0'] }, isLatLong$, 'a');
  testValidation(FAILURE, { a: ['+90.0', true] }, isLatLong$, 'a');
  testValidation(FAILURE, { a: true }, isLatLong$, 'a');
});
