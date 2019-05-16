import { assert } from 'chai';
import Info from '../../src/util/info';
import Argument from '../../src/util/argument';

describe('Test Info class.', () => {
  function nakedValidator() {
    return () => undefined;
  }
  const stringArgs = ['myPath:path', 'num:integer?', '...rest:object'];
  const args = [
    new Argument('myPath', 'path', false, false),
    new Argument('num', 'integer', true, false),
    new Argument('rest', 'object', false, true)
  ];
  const info = new Info(nakedValidator, ...args);
  info.consolidate();
  it('Info should be frozen', () => {
    assert(Object.isFrozen(info), ':(');
  });
  it('Validator and its info should point each other', () => {
    assert(nakedValidator.info === info && nakedValidator === info.validator, ':(');
  });
  it('Check validator\'s name', () => {
    assert(nakedValidator.name === info.name, ':(');
  });
  it('Check argument descriptors created from string representation', () => {
    const info2 = new Info(nakedValidator, ...stringArgs);
    info2.consolidate();
    assert.deepEqual(info, info2, ':(');
  });
});
