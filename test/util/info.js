import { assert } from 'chai';
import Info from '../../src/util/info';
import Argument from '../../src/util/argument';
import Scope from '../../src/util/scope';
import { V } from '../../src';

describe('Test class Info.', () => {
  it('Info should throw an error on prepare if any argument descriptors is neither a string, nor an object, nor an Argument instance', () => {
    const info = new Info('badArg', []);
    assert.throws(() => info.prepare(), Error, 'Invalid argument definition');
  });
  it('Info should throw an error on prepare if rest parameter is used before the last argument', () => {
    const info = new Info('badRestParam', '...num:integer', 'tag:string');
    assert.throws(() => info.prepare(), Error, 'rest parameter');
  });
  it('Infoshould throw an error on prepare because method create is not implemented', () => {
    const info = new Info('createNotImplemented', 'num:integer');
    assert.throws(() => info.prepare(), Error, 'create');
  });
});

describe('Test ConcreteInfo subclass.', () => {
  class ConcreteInfo extends Info {
    /* eslint-disable-next-line class-methods-use-this */
    create() {
      return (arg1, arg2) => scope => undefined; // eslint-disable-line no-unused-vars
    }
  }
  const stringArgs = ['myPath:path', 'num:integer?', '...rest:object'];
  const args = [
    new Argument({ name: 'myPath', type: 'path' }),
    new Argument({ name: 'num', type: 'integer?' }),
    new Argument({ name: 'rest', type: 'object', restParams: true })
  ];
  it('ConcreteInfo should be frozen once prepared', () => {
    const info = new ConcreteInfo('frozen', ...args).prepare();
    assert(Object.isFrozen(info), ':(');
  });
  it('ConcreteInfo and its validator info should point each other', () => {
    const info = new ConcreteInfo('circularReference', ...args).prepare();
    assert(info === info.validator.info, ':(');
  });
  it('Validator\'s name from info should match the function name', () => {
    const info = new ConcreteInfo('myValidator', ...args).prepare();
    assert(info.validator.name === info.name, ':(');
  });
  it('Argument descriptors created from string should match the ones from corresponding Argument instances', () => {
    const info1 = new ConcreteInfo('namedValidator', ...args).prepare();
    const info2 = new ConcreteInfo('namedValidator', ...stringArgs).prepare();
    assert.deepEqual(info1.argDescriptors, info2.argDescriptors, ':(');
  });
  it('Invalid argument definition should throw an error on prepare', () => {
    assert.throws(() => new ConcreteInfo('invalidArgDef', 123).prepare(), Error, 'Invalid argument definition');
  });
});

describe('Test opt and $ variants.', () => {
  class TestInfo extends Info {
    /* eslint-disable-next-line class-methods-use-this */
    create() {
      return arg1 => scope => 'done'; // eslint-disable-line no-unused-vars
    }
  }
  it('Opt variant of xyz should be optXyz', () => {
    const info = new TestInfo('xyz', 'num:integer').prepare(true);
    assert(info.name === 'optXyz', ':(');
  });
  it('optXyz(a): should allow null as 1st argument', () => {
    const info = new TestInfo('xyz', 'num:integer').prepare(true);
    assert(info.argDescriptors[0].type.check(null), ':(');
  });
  it('optXyz(a1): bad value as 1st argument should throw an error at compile time', () => {
    const info = new TestInfo('xyz', 'num:integer').prepare(true);
    assert.throws(() => info.validator(() => null), Error, 'Expected type \'null|integer\'');
  });
  it('optXyz(a1, a2): Bad value as 2nd argument should throw an error at compile time', () => {
    const info = new TestInfo('xyz', 'num:integer', 'values:string|array').prepare(true);
    assert.throws(() => info.validator(3, 2), Error, 'Expected type \'string|array\'');
  });
  it('optXyz$(path): missing property at path should succeed', () => {
    const info = new TestInfo('xyz', 'value:integer').prepare(true, true);
    const v = info.validator('a');
    assert(v(new Scope({})) === undefined, ':(');
  });
  it('optXyz$(path): not missing property at path should always match xyz$(path)', () => {
    const info1 = new TestInfo('xyz', 'value:integer').prepare(false, true);
    const info2 = new TestInfo('xyz', 'value:integer').prepare(true, true);
    const v1 = info1.validator('a');
    const v2 = info2.validator('a');
    assert(v1(new Scope({ a: 123 })) === v2(new Scope({ a: 123 })), ':(');
  });
  it('optXyz$(path): missing property at referenced path should always succeed', () => {
    const info = new TestInfo('xyz', 'value:integer').prepare(true, true);
    const v = V.def({ p: 'a' }, info.validator({ $var: 'p' }));
    assert(v(new Scope({})) === undefined, ':(');
  });
  it('optXyz$(path): not missing property at referenced path should always match xyz$(path)', () => {
    const info1 = new TestInfo('xyz', 'value:integer').prepare(false, true);
    const info2 = new TestInfo('xyz', 'value:integer').prepare(true, true);
    const v1 = V.def({ p: 'a' }, info1.validator({ $var: 'p' }));
    const v2 = V.def({ p: 'a' }, info2.validator({ $var: 'p' }));
    assert(v1(new Scope({ a: 0 })) === v2(new Scope({ a: 32 })), ':(');
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
