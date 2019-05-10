import { assert } from 'chai';
import V from '../src';
import ensureArg from '../src/util/ensure-arg';

const VALIDATOR_REF = 'vaidatorRef';
const VALUE_REF = 'valueRef';

class ArgTestInfo {
  constructor(name, refType, goodValue, unknownRefShouldPassCreation) {
    this.name = name;
    this.refType = refType;
    this.goodValue = goodValue;
    this.badValue = refType === VALIDATOR_REF ? 'Bad validator!' : () => {};
    this.unknownRefShouldPassCreation = !!unknownRefShouldPassCreation;
  }

  acceptValueRef() {
    return this.refType === VALUE_REF;
  }

  acceptValidatorRef() {
    return this.refType === VALIDATOR_REF;
  }

  value(good) {
    return good ? this.goodValue : this.badValue;
  }
}

const argInfo = [
  new ArgTestInfo('any', VALUE_REF, 1),
  new ArgTestInfo('array', VALUE_REF, []),
  new ArgTestInfo('child', VALIDATOR_REF, V.isSet(''), false),
  new ArgTestInfo('integer', VALUE_REF, 1),
  new ArgTestInfo('number', VALUE_REF, 1.2),
  new ArgTestInfo('object', VALUE_REF, {}, true),
  new ArgTestInfo('options', VALUE_REF, {}, true),
  new ArgTestInfo('path', VALUE_REF, 'a'),
  new ArgTestInfo('string', VALUE_REF, 'Hello'),
  new ArgTestInfo('stringOrArray', VALUE_REF, []),
  new ArgTestInfo('type', VALUE_REF, 'string')
].reduce((acc, e) => {
  acc[e.name] = e;
  return acc;
}, {});

// Make sure all arg kinds have been taken into account for the tests
let inconsistentKinds = ensureArg.kinds.filter(k => !argInfo[k]);
if (inconsistentKinds.length > 0) {
  throw new Error(`Some argument kinds have not been taken into account for the tests: ${inconsistentKinds.join(', ')}`);
}
// Make sure all arg kinds used for the tests are known
inconsistentKinds = Object.keys(argInfo).filter(k => !ensureArg.kinds.includes(k));
if (inconsistentKinds.length > 0) {
  throw new Error(`Some argument kinds used for the tests are unknown: ${inconsistentKinds.join(', ')}`);
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function ordinal(n) {
  switch (n) {
    case 1: return '1st';
    case 2: return '2nd';
    case 3: return '3rd';
    default: return `${n}th`;
  }
}

function shouldThrowErrorOnMissingArg(validatorName, args, index, errorLike) {
  const badArgs = Array.from(args);
  badArgs[index] = undefined;
  it(`Should throw immediately an error if the ${ordinal(index + 1)} argument is missing`, () => {
    assert.throws(() => V[validatorName](...badArgs), errorLike || Error);
  });
}

function testArgument(kind, validatorName, args, index, errorLike) {
  if (!(kind in argInfo)) {
    throw new Error(`Unknown type argument '${kind}'`);
  }
  const vld = V[validatorName];
  const testArgs = Array.from(args);

  // Test unexpected value
  it(`Should throw immediately an error on bad ${kind} as ${ordinal(index + 1)} argument`, () => {
    testArgs[index] = argInfo[kind].badValue;
    assert.throws(() => vld(...testArgs), errorLike || Error);
  });

  // Test references
  if (argInfo[kind].refType) {
    if (argInfo[kind].unknownRefShouldPassCreation) {
      it(`Should pass creation on unknown reference type as ${ordinal(index + 1)} argument`, () => {
        testArgs[index] = { $unknownRefType: 'something' };
        assert(typeof vld(...testArgs) === 'function', ':(');
      });
    } else {
      it(`Should throw immediately an error on unknown reference type as ${ordinal(index + 1)} argument`, () => {
        testArgs[index] = { $unknownRefType: 'something' };
        assert.throws(() => vld(...testArgs), errorLike || Error);
      });
    }
    ['$path', '$var'].forEach(refType => it(`Should delay ${refType} reference resolution at validation time for ${kind} as ${ordinal(index + 1)} argument`, () => {
      testArgs[index] = { [refType]: 'something' };
      assert(typeof vld(...testArgs) === 'function', ':(');
    }));
  }
}

function testValidation(successExpected, obj, vName, ...args) {
  it(`${vName}(${args.map(a => JSON.stringify(a)).join(', ')}) should ${successExpected ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V[vName](...args);
    assert(successExpected ? v(obj) === undefined : v(obj) !== undefined, ':(');
  });

  // Test $var references
  const scope = args.reduce((acc, a, i) => {
    acc[`v${i}`] = a;
    return acc;
  }, {});
  const varArgs = args.map((a, i) => ({ $var: `v${i}` }));
  it(`${vName}(${varArgs.map(a => JSON.stringify(a)).join(', ')}) in scope ${JSON.stringify(scope)} should ${successExpected ? 'succeed' : 'fail'} for ${JSON.stringify(obj)}`, () => {
    const v = V.def(scope, V[vName](...varArgs));
    assert(successExpected ? v(obj) === undefined : v(obj) !== undefined, ':(');
  });

  // Test $path references
  const obj2 = args.reduce((acc, a, i) => {
    acc[`_${i}`] = a;
    return acc;
  }, clone(obj));
  const pathArgs = args.map((a, i) => ({ $path: `_${i}` }));
  it(`${vName}(${pathArgs.map(a => JSON.stringify(a)).join(', ')}) should ${successExpected ? 'succeed' : 'fail'} for ${JSON.stringify(obj2)}`, () => {
    const v = V[vName](...pathArgs);
    assert(successExpected ? v(obj2) === undefined : v(obj2) !== undefined, ':(');
  });
}

export {
  argInfo,
  clone,
  shouldThrowErrorOnMissingArg,
  testArgument,
  testValidation
};
