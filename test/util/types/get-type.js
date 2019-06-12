import { assert } from 'chai';
import { getType } from '../../../src/util/types';

function typesToArray(typesAsString) {
  return typesAsString.split('|').map(t => `\t${t.trim()} `).sort();
}

describe('Test getType(typeDesc).', () => {
  it('typeDesc that is neither a pipe separated string nor an array of strings should throw an error.', () => {
    assert.throws(() => getType({}), Error, 'separated');
  });
  it('typeDesc as an empty array should throw an error.', () => {
    assert.throws(() => getType([]), Error, 'one member');
  });
  it('typeDesc as a blank string should throw an error.', () => {
    assert.throws(() => getType('   '), Error, 'Unknown native type');
  });
  it('typeDesc as a string matching a native type name should return each time the same instance of that native type.', () => {
    const name = 'path';
    const get1 = getType(name);
    const get2 = getType(name);
    assert(get1 === get2 && get1.name === name, ':(');
  });
  it('typeDesc as an array containing a string matching any native type name should return each time the same instance of that native type.', () => {
    const name = 'path';
    const get1 = getType(name);
    const get2 = getType(typesToArray(name));
    assert(get1 === get2, ':(');
  });
  it('Requesting union types with more than one member should return each time a new instance.', () => {
    const name = 'path|boolean';
    const get1 = getType(name);
    const get2 = getType(name);
    assert(get1 !== get2, ':(');
  });
  it('Requesting union types with more than one member should return each time distinct but equal instances.', () => {
    const name = 'path|boolean';
    const get1 = getType(name);
    const get2 = getType(typesToArray(name));
    assert.deepEqual(get1, get2, ':(');
  });
  it('Union types with any unknown native type as member should throw an error.', () => {
    const types = ' integer| STRING|child  |boolean  ';
    assert.throws(() => getType(types), Error, 'Unknown native type');
  });
  it('Union types with either an optional type or null as member should be distinct instances.', () => {
    const t1 = getType('integer?');
    const t2 = getType('null|integer');
    assert(t1 !== t2, ':(');
  });
  it('Union types with either an optional type or null as member should be identic.', () => {
    const t1 = getType('integer?');
    const t2 = getType('null|integer');
    assert.deepEqual(t1, t2, ':(');
  });
  it('Union types with redundant type members should be simplified.', () => {
    const t1 = getType('any');
    const t2 = getType('null|any|string?|boolean');
    assert.deepEqual(t1, t2, ':(');
  });
  it('Union types with the same members in different order should be identic.', () => {
    const types = ' integer| string|child  ? |boolean  ';
    const t1 = getType(types);
    const t2 = getType(typesToArray(types));
    assert.deepEqual(t1, t2, ':(');
  });
});
