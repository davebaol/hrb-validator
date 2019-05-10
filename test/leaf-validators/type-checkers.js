import { assert } from 'chai';
import { testArgument } from '../test-utils';
import V from '../../src';

function testRefsToo(successExpected, obj, vName, ...args) {
  it(`${vName}(${args.map(a => JSON.stringify(a)).join(', ')}) should ${successExpected ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V[vName](...args);
    assert(successExpected ? v(obj) === undefined : v(obj) !== undefined, ':(');
  });

  // Test references
  const scope = args.reduce((acc, a, i) => {
    acc[`v${i}`] = a;
    return acc;
  }, {});
  const refArgs = args.map((a, i) => ({ $var: `v${i}` }));
  it(`${vName}(${refArgs.map(a => JSON.stringify(a)).join(', ')}) in scope ${JSON.stringify(scope)} should ${successExpected ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.def(scope, V[vName](...refArgs));
    assert(successExpected ? v(obj) === undefined : v(obj) !== undefined, ':(');
  });
}

describe('Test leaf validator isType.', () => {
  const args = ['', 'string'];
  testArgument('path', 'isType', args, 0);
  testArgument('type', 'isType', args, 1);
  testRefsToo(true, { a: '' }, 'isType', [], 'object');
  testRefsToo(true, { a: '' }, 'isType', '', 'object');
  testRefsToo(true, { a: false }, 'isType', 'a', 'boolean');
  testRefsToo(true, { a: true }, 'isType', 'a', 'boolean');
  testRefsToo(false, { a: null }, 'isType', 'a', 'boolean');
  testRefsToo(true, { a: false }, 'isType', 'a', ['boolean', 'array']);
  testRefsToo(true, { a: [] }, 'isType', 'a', ['boolean', 'array']);
  testRefsToo(false, { a: '...' }, 'isType', 'a', ['boolean', 'array']);
});

describe('Test leaf validator isArrayOf.', () => {
  const args = ['', 'string'];
  testArgument('path', 'isArrayOf', args, 0);
  testArgument('type', 'isArrayOf', args, 1);
  testRefsToo(true, [false], 'isArrayOf', [], 'boolean');
  testRefsToo(true, [false], 'isArrayOf', '', 'boolean');
  testRefsToo(true, { a: [false] }, 'isArrayOf', 'a', 'boolean');
  testRefsToo(false, { a: [false, 'true'] }, 'isArrayOf', 'a', 'boolean');
  testRefsToo(true, { a: [false, 'true'] }, 'isArrayOf', 'a', ['boolean', 'string']);
  testRefsToo(false, { a: [false, 'true', 0] }, 'isArrayOf', 'a', ['boolean', 'string']);
});
