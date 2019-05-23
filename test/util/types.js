import { assert } from 'chai';
import { UnionType } from '../../src/util/types';

describe('Test UnionType class.', () => {
  it('Union type whose members are neither a pipe separated string or an array of strings should throw an error.', () => {
    assert.throws(() => new UnionType({}), Error, 'separated');
  });
  it('Union type whitout members should throw an error.', () => {
    assert.throws(() => new UnionType([]), Error);
  });
  it('Union types with any unknown native type as member should throw an error.', () => {
    const types = ' integer| STRING|child  |boolean  ';
    assert.throws(() => new UnionType(types), Error, 'Unknown native type');
  });
  it('Union types with either an optional type or null as member should be identic.', () => {
    const t1 = new UnionType('integer?');
    const t2 = new UnionType('null|integer');
    assert.deepEqual(t1, t2, ':(');
  });
  it('Union types with the same members in different order should be identic.', () => {
    const types = ' integer| string|child  ? |boolean  ';
    const t1 = new UnionType(types);
    const t2 = new UnionType(types.split('|').map(t => ` ${t.trim()} `).sort());
    assert.deepEqual(t1, t2, ':(');
  });
});
