import { assert } from 'chai';
import Context from '../../src/util/context';

function typesToArray(typesAsString) {
  return typesAsString.split('|').map(t => `\t${t.trim()} `).sort();
}

function typesTypeInstance(typesAsString, useArray) {
  const context = new Context();
  const get1 = context.getType(typesAsString);
  const get2 = context.getType(useArray ? typesToArray(typesAsString) : typesAsString);
  assert(get1 === get2, ':(');
}

describe('Test context.getType(typeName).', () => {
  it('Requesting twice a native type should return each time the same instance.', () => {
    typesTypeInstance('path', false);
  });
  it('Requesting twice (via string and via array) a native type should return each time the same instance.', () => {
    typesTypeInstance('path', true);
  });
  it('Requesting twice union types with more than one member should return each time the same instance.', () => {
    typesTypeInstance('path|boolean', false);
  });
  it('Requesting twice (via string and via array) union types with more than one member should return each time the same instance.', () => {
    typesTypeInstance('path|boolean', true);
  });
});
