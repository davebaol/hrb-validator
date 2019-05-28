import { assert } from 'chai';
import Info from '../../src/util/info';
import Argument from '../../src/util/argument';
import Reference from '../../src/util/reference';
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

describe('Test Info.ensureRestParams().', () => {
  const { info } = V.and;
  it('Should return the same array specified in input if all its validators are hard-coded', () => {
    const vlds = [V.isSet('a'), V.isSet('b')];
    assert(info.ensureRestParams(vlds) === vlds, ':(');
  });
  it('Should return a new array if any of the validators specified in input is non hard-coded', () => {
    const vlds = [V.isSet('a'), { isSet: ['b'] }];
    const ensuredValidators = info.ensureRestParams(vlds);
    assert(ensuredValidators !== vlds && Array.isArray(ensuredValidators), ':(');
  });
  it('Should return a new array made only of validators if references are not used in input validators', () => {
    const vlds = [V.isSet('a'), { isSet: ['b'] }];
    const ensuredValidators = info.ensureRestParams(vlds);
    assert(ensuredValidators.every(v => typeof v === 'function'), ':(');
  });
  it('Should return a new mixed array made of validators and references at proper index', () => {
    const vlds = [V.isSet('a'), { isSet: ['b'] }];
    const valRefIndex = 1;
    vlds.splice(valRefIndex, 0, { $var: '$this_is_a_validator_reference' });
    const ensuredValidators = info.ensureRestParams(vlds);
    assert(ensuredValidators.every((v, i) => (i === valRefIndex ? v instanceof Reference : typeof v === 'function')), ':(');
  });
});
