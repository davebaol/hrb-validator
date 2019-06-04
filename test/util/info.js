import { assert } from 'chai';
import Info from '../../src/util/info';
import Argument from '../../src/util/argument';
import V from '../../src';

describe('Test Info instance creation.', () => {
  function validator(name) {
    const v = () => undefined;
    if (name) {
      Object.defineProperty(v, 'name', { value: name, writable: false });
    }
    return v;
  }
  const stringArgs = ['myPath:path', 'num:integer?', '...rest:object'];
  const args = [
    new Argument({ name: 'myPath', type: 'path' }),
    new Argument({ name: 'num', type: 'integer?' }),
    new Argument({ name: 'rest', type: 'object', restParams: true })
  ];
  it('Info constructor should throw an error if 1st argument is an anonymous function', () => {
    assert.throws(() => new Info(() => undefined, ...args), Error);
  });
  it('Info constructor should throw an error if 1st argument is neither a named function or its name', () => {
    assert.throws(() => new Info({}, ...args), Error);
  });
  it('Info should throw an error on consolidate if any argument descriptors is neither a string, nor an object, nor an Argument instance', () => {
    const info = new Info(validator('namedValidator'), []);
    assert.throws(() => info.consolidate(), Error, 'Invalid argument definition');
  });
  it('Info should throw an error on consolidate if rest parameter is used before the last argument', () => {
    const info = new Info(validator('badRestParam'), '...num:integer', 'tag:string');
    assert.throws(() => info.consolidate(), Error, 'rest parameter');
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
  it('Validator\'s name from info should match the function name', () => {
    const v = validator('namedValidator');
    const info = new Info(v, ...args);
    info.consolidate();
    assert(v.name === info.name, ':(');
  });
  it('Argument descriptors created from string should match the ones from corresponding Argument instances', () => {
    const info1 = new Info(validator('namedValidator'), ...args);
    info1.consolidate();
    const info2 = new Info(validator('namedValidator'), ...stringArgs);
    info2.consolidate();
    assert.deepEqual(info1.argDescriptors, info2.argDescriptors, ':(');
  });
});

describe('Test Info.compileRestParams().', () => {
  const { info } = V.and;
  it('Rest param child should return an array of resolved expressions whose result is a function regardless of children are hard-coded or not', () => {
    const vlds = [V.isSet('a'), V.isSet('b'), { isSet: ['b'] }];
    assert(info.compileRestParams(vlds).every(e => e.resolved && typeof e.result === 'function'), ':(');
  });
  it('Rest param child should return an array of resolved expressions whose result is a function even if references are used in validators arguments', () => {
    const vlds = [V.isSet('a'), { isSet: [{ $var: 'my_var' }] }];
    assert(info.compileRestParams(vlds).every(e => e.resolved && typeof e.result === 'function'), ':(');
  });
  it('Should return a new mixed array made of validators and references at proper index', () => {
    const vlds = [V.isSet('a'), { isSet: [{ $var: 'my_var' }] }];
    const valRefIndex = 1;
    vlds.splice(valRefIndex, 0, { $var: '$this_is_a_validator_reference' });
    const ensuredValidators = info.compileRestParams(vlds);
    assert(ensuredValidators.every((e, i) => (i === valRefIndex ? !e.resolved : e.resolved)), ':(');
  });
});
