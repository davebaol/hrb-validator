import { assert } from 'chai';
import V from '../src';
import ensureArg from '../src/util/ensure-arg';

const NO_BAD_VALUE = {};
const VALIDATOR_REF = 'vaidatorRef';
const VALUE_REF = 'valueRef';

const argInfo = {
  any: { badValue: NO_BAD_VALUE, refType: VALUE_REF },
  array: { badValue: 'Bad array!', refType: VALUE_REF },
  child: { badValue: 'Bad child!', refType: VALIDATOR_REF, unknownRefShouldPassCreation: false },
  integer: { badValue: 'Bad integer!', refType: VALUE_REF },
  number: { badValue: 'Bad number!', refType: VALUE_REF },
  object: { badValue: 'Bad object!', refType: VALUE_REF, unknownRefShouldPassCreation: true },
  options: { badValue: 'Bad options!', refType: VALUE_REF, unknownRefShouldPassCreation: true },
  path: { badValue: {}, refType: VALUE_REF },
  string: { badValue: [], refType: VALUE_REF },
  stringOrArray: { badValue: {}, refType: VALUE_REF },
  type: { badValue: {}, refType: VALUE_REF }
};

// Make sure all arg kinds have been taken into account for the tests
const inconsistentKinds = Object.keys(ensureArg).reduce((acc, k) => {
  if (k.endsWith('Ref') && typeof ensureArg[k] === 'function') {
    const kind = k.substring(0, k.length - 3);
    if (!argInfo[kind] && typeof ensureArg[kind] === 'function') {
      acc.push(kind);
    }
  }
  return acc;
}, []);
if (inconsistentKinds.length > 0) {
  throw new Error(`Some argument kinds have not been taken into account for the tests: ${inconsistentKinds.join(', ')}`);
}
// Make sure all arg kinds used for the tests are known
Object.keys(argInfo).reduce((acc, k) => {
  if (typeof ensureArg[k] !== 'function') {
    acc.push(k);
  }
  return acc;
}, inconsistentKinds);
if (inconsistentKinds.length > 0) {
  throw new Error(`Some argument kinds used for the tests are unknown: ${inconsistentKinds.join(', ')}`);
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
  if (argInfo[kind].badValue !== NO_BAD_VALUE) {
    it(`Should throw immediately an error on bad ${kind} as ${ordinal(index + 1)} argument`, () => {
      testArgs[index] = argInfo[kind].badValue;
      assert.throws(() => vld(...testArgs), errorLike || Error);
    });
  }

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
    ['$path', '$var', '$val'].forEach(refType => it(`Should delay ${refType} reference resolution at validation time for ${kind} as ${ordinal(index + 1)} argument`, () => {
      testArgs[index] = { [refType]: 'something' };
      assert(typeof vld(...testArgs) === 'function', ':(');
    }));
  }
}

export {
  shouldThrowErrorOnMissingArg,
  testArgument
};
