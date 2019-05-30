import { assert } from 'chai';
import Context from '../../src/util/context';
import { ensureScope } from '../../src/util/ensure-scope';
import Reference from '../../src/util/reference';
import { getNativeType } from '../../src/util/types';
import { ensureArrayPath } from '../../src/util/path';

function refPath(targetPath, varName, path) {
  const ret = varName === undefined ? {} : { varName };
  ret.targetPath = ensureArrayPath(targetPath);
  ret.path = ensureArrayPath(path);
  return ret;
}

function testRefPaths(type, isRoot, source, expectedRefPaths) {
  it(`Test refPaths for newly created ${isRoot ? 'root' : 'embedded'} reference ${JSON.stringify(source)}.`, () => {
    const ref = new Reference(source, type);
    assert.deepEqual(ref.refPaths, expectedRefPaths, ':(');
  });
}

function testRootRefCreate(type, source, expectedRefPaths) {
  testRefPaths(type, true, source, expectedRefPaths);
  it(`Target should be undefined for newly created root reference ${JSON.stringify(source)}.`, () => {
    const ref = new Reference(source, type);
    assert(ref.isRootRef === true && ref.resolved === false && ref.target === undefined, ':(');
  });
}

function testEmbeddedRefCreate(type, source, expectedRefPaths) {
  testRefPaths(type, false, source, expectedRefPaths);
  it(`Target and source should be different instances for newly created embedded reference ${JSON.stringify(source)}.`, () => {
    const ref = new Reference(source, type);
    assert(ref.isRootRef === false && ref.resolved === false && ref.target !== ref.source, ':(');
  });
  it(`Target should be a source clone for embedded reference ${JSON.stringify(source)}.`, () => {
    const ref = new Reference(source, type);
    assert.deepEqual(ref.target, ref.source, ':(');
  });
}

function tesResolve(type, isRoot, source, scope, obj, expected) {
  it(`Resolving ${isRoot ? 'root' : 'embedded'} reference ${JSON.stringify(source)} in scope ${JSON.stringify(scope)} on object ${JSON.stringify(obj)} should return ${JSON.stringify(expected)}.`, () => {
    if (ensureScope(scope) !== scope) {
      throw new Error('Fix your test!!! Scope with references are not supported by this test');
    }
    const context = new Context();
    context.push(scope);
    const ref = new Reference(source, type);
    assert.deepEqual(ref.resolve(context, obj), expected, ':(');
  });
}

function testRefCreateForValidatorWithDeepPath(type) {
  const source = { $var: '$myValidator.a' };
  it(`Validator reference ${JSON.stringify(source)} should throw an error because of the deep path.`, () => {
    assert.throws(() => new Reference(source, type), Error, 'Illegal validator reference');
  });
}

const integerType = getNativeType('integer');
const childType = getNativeType('child');

describe('Test Reference class.', () => {
  testRefCreateForValidatorWithDeepPath(childType);
  testRootRefCreate(childType, { $var: '$myValidator' }, [refPath('', '$myValidator', '')]);
  testRootRefCreate(integerType, { $var: 'record.fields.1' }, [refPath('', 'record', 'fields.1')]);
  testRootRefCreate(integerType, { $path: 'record.fields.1' }, [refPath('', undefined, 'record.fields.1')]);
  testEmbeddedRefCreate(integerType, {
    bounds: {
      upper: { $var: 'record.fields.1' },
      lower: { $path: 'a.b.0' }
    },
    dummy: true
  },
  [
    refPath('bounds.upper', 'record', 'fields.1'),
    refPath('bounds.lower', undefined, 'a.b.0')
  ]);
  tesResolve(integerType, true, { $var: 'record.fields.1' }, { record: { fields: ['xyz', 123, true] } }, {}, 123);
  tesResolve(integerType, true, { $path: 'record.fields.1' }, {}, { record: { fields: ['xyz', 123, true] } }, 123);
  tesResolve(integerType, false, [{ $var: 'record.0' }, { $path: 'a' }], { record: ['hello', 'world'] }, { a: 123 }, ['hello', 123]);
});
