import { assert } from 'chai';
import Info from '../../src/util/info';
import Argument from '../../src/util/argument';

describe('Test Info class.', () => {
  function validator(name) {
    const v = () => undefined;
    if (name) {
      Object.defineProperty(v, 'name', { value: name, writable: false });
    }
    return v;
  }
  const stringArgs = ['myPath:path', 'num:integer?', '...rest:object'];
  const args = [
    new Argument('myPath', 'path', false, false),
    new Argument('num', 'integer', true, false),
    new Argument('rest', 'object', false, true)
  ];
  it('Info constructor should accept only strings or Argument instances as argument descriptors', () => {
    assert.throws(() => new Info(validator('namedValidator'), {}), Error);
  });
  it('Info constructor should throw an error if 1st argument is an anonymous function', () => {
    assert.throws(() => new Info(() => undefined, ...args), Error);
  });
  it('Info constructor should throw an error if 1st argument is neither a named function ora its name', () => {
    assert.throws(() => new Info({}, ...args), Error);
  });
  it('Info created by name should throw an error on consolidate (method link not implemented)', () => {
    const info = new Info('funcName', ...args);
    assert.throws(() => info.consolidate(), Error, 'link');
  });
  it('Info should be frozen once consolidated', () => {
    const info = new Info(validator('namedValidator'), ...args);
    info.consolidate();
    assert(Object.isFrozen(info), ':(');
  });
  it('Validator and its info should point each other', () => {
    const v = validator('namedValidator');
    const info = new Info(v, ...args);
    info.consolidate();
    assert(v.info === info && v === info.validator, ':(');
  });
  it('Check validator\'s name', () => {
    const v = validator('namedValidator');
    const info = new Info(v, ...args);
    info.consolidate();
    assert(v.name === info.name, ':(');
  });
  it('Check argument descriptors created from string representation', () => {
    const info1 = new Info(validator('namedValidator'), ...args);
    info1.consolidate();
    const info2 = new Info(validator('namedValidator'), ...stringArgs);
    info2.consolidate();
    assert.deepEqual(info1.argDescriptors, info2.argDescriptors, ':(');
  });
});
