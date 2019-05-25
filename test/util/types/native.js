import { assert } from 'chai';
import { isRegExp } from 'util';
import getValue from 'get-value';
import types from '../../../src/util/types';
import V from '../../../src';

function merge(source, ...keys) {
  return keys.reduce((acc, k) => acc.concat(getValue(source, k)), []);
}

const GOOD_VALUES = {
  array: [[], ['a', 1]],
  boolean: [true, false],
  child: [{ isSet: [''] }, V.isSet('')],
  integer: [123],
  null: [null, undefined],
  number: [12.3, Number.POSITIVE_INFINITY, Number.NaN],
  object: [{}, { a: 1 }],
  regex: [/abc/],
  string: ['abc']
};
GOOD_VALUES.number = merge(GOOD_VALUES, 'number', 'integer');
GOOD_VALUES.object = merge(GOOD_VALUES, 'object', 'child.0');
GOOD_VALUES.path = merge(GOOD_VALUES, 'array', 'number', 'null', 'number.1', 'string');
GOOD_VALUES.any = merge(GOOD_VALUES, 'array', 'boolean', 'child.0', 'integer', 'null', 'number', 'string', 'object', 'regex');

function stringifyValue(v) {
  if (isRegExp(v)) { return v.toString(); }
  if (v === undefined) { return 'undefined'; }
  if (v === Number.POSITIVE_INFINITY) { return 'infinity'; }
  if (Number.isNaN(v)) { return 'NaN'; }
  return typeof v === 'function' ? 'function()' : JSON.stringify(v);
}

function stringifyArray(values) {
  return values.map(v => stringifyValue(v)).join(', ');
}

function testNativeType(type, expectedObj) {
  it(`Type '${type.name}' should match expected properties`, () => {
    const typeObj = {
      name: type.name,
      nullable: type.nullable,
      acceptsValue: type.acceptsValue,
      acceptsValidator: type.acceptsValidator,
      swallowsRef: type.swallowsRef,
      refResolver: type.refResolver
    };
    assert.deepEqual(typeObj, expectedObj, ':(');
  });
  const goodValues = GOOD_VALUES[type.name]
    .sort((a, b) => stringifyValue(b).localeCompare(stringifyValue(b)))
    .filter((x, i, a) => !i || x !== a[i - 1]); // unique sort
  it(`Type '${type.name}' should accept good values ${stringifyArray(goodValues)}`, () => {
    assert(goodValues.every(v => type.check(v)), ':(');
  });
  const badValues = Object.keys(GOOD_VALUES)
    .reduce((acc, k) => acc.concat(GOOD_VALUES[k].filter(v => !goodValues.includes(v))), [])
    .sort((a, b) => stringifyValue(a).localeCompare(stringifyValue(b)))
    .filter((x, i, a) => !i || x !== a[i - 1]); // unique sort
  it(`Type '${type.name}' should reject bad values ${stringifyArray(badValues)}`, () => {
    assert(badValues.every(v => !type.check(v)), ':(');
  });
}

describe('Test native type classes.', () => {
  testNativeType(new types.AnyType(), {
    name: 'any',
    nullable: true,
    acceptsValue: true,
    acceptsValidator: false,
    swallowsRef: true,
    refResolver: 'resolveValueRef'
  });

  testNativeType(new types.ArrayType(), {
    name: 'array',
    nullable: false,
    acceptsValue: true,
    acceptsValidator: false,
    swallowsRef: false,
    refResolver: 'resolveValueRef'
  });

  testNativeType(new types.BooleanType(), {
    name: 'boolean',
    nullable: false,
    acceptsValue: true,
    acceptsValidator: false,
    swallowsRef: false,
    refResolver: 'resolveValueRef'
  });

  testNativeType(new types.ChildType(), {
    name: 'child',
    nullable: false,
    acceptsValue: false,
    acceptsValidator: true,
    swallowsRef: false,
    refResolver: 'resolveValidatorRef'
  });

  testNativeType(new types.IntegerType(), {
    name: 'integer',
    nullable: false,
    acceptsValue: true,
    acceptsValidator: false,
    swallowsRef: false,
    refResolver: 'resolveValueRef'
  });

  testNativeType(new types.NullType(), {
    name: 'null',
    nullable: true,
    acceptsValue: true,
    acceptsValidator: false,
    swallowsRef: false,
    refResolver: 'resolveValueRef'
  });

  testNativeType(new types.NumberType(), {
    name: 'number',
    nullable: false,
    acceptsValue: true,
    acceptsValidator: false,
    swallowsRef: false,
    refResolver: 'resolveValueRef'
  });

  testNativeType(new types.ObjectType(), {
    name: 'object',
    nullable: false,
    acceptsValue: true,
    acceptsValidator: false,
    swallowsRef: true,
    refResolver: 'resolveValueRef'
  });

  testNativeType(new types.PathType(), {
    name: 'path',
    nullable: true,
    acceptsValue: true,
    acceptsValidator: false,
    swallowsRef: false,
    refResolver: 'resolveValueRef'
  });

  testNativeType(new types.RegexType(), {
    name: 'regex',
    nullable: false,
    acceptsValue: true,
    acceptsValidator: false,
    swallowsRef: false,
    refResolver: 'resolveValueRef'
  });

  testNativeType(new types.StringType(), {
    name: 'string',
    nullable: false,
    acceptsValue: true,
    acceptsValidator: false,
    swallowsRef: false,
    refResolver: 'resolveValueRef'
  });
});
