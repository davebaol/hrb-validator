import { assert } from 'chai';
import Info from '../../src/util/info';

describe('Test Info class.', () => {
  function nakedValidator() {
    return () => undefined;
  }
  const args = ['myPath:path', 'num:integer?', '...rest:object'];
  const expectedDescriptors = [
    {
      stringDesc: 'myPath:path', restParams: false, name: 'myPath', type: 'path', optional: false
    },
    {
      stringDesc: 'num:integer?', restParams: false, name: 'num', type: 'integer', optional: true
    },
    {
      stringDesc: '...rest:object', restParams: true, name: 'rest', type: 'object', optional: false
    }
  ];
  const info = new Info(nakedValidator, ...args);
  it('Validator and its info should point each other', () => {
    assert(nakedValidator.owner === info && nakedValidator === info.validator, ':(');
  });
  it('Check validator\'s name', () => {
    assert(nakedValidator.name === info.name, ':(');
  });
  it('Check argument descriptors created from string representation', () => {
    assert.deepEqual(info.argDescriptors, expectedDescriptors, ':(');
  });

  it('Check string representation created for argument descriptors', () => {
    const objDescriptors = expectedDescriptors.map((d) => {
      const d2 = Object.assign({}, d);
      delete d2.stringDesc;
      return d;
    });
    const info2 = new Info(nakedValidator, ...objDescriptors);
    const stringDesc = info2.argDescriptors.map(d => d.stringDesc);
    assert.deepEqual(stringDesc, args, ':(');
  });
});
