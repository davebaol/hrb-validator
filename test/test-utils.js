import { assert } from 'chai';
import V from '../src';


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

const VALIDATOR_REF = 'vaidatorRef';
const VALUE_REF = 'valueRef';

const argInfo = {
  array: { badValue: 'Bad array!', refType: VALUE_REF },
  child: { badValue: 'Bad child!', refType: VALIDATOR_REF, unknownRefShouldPassCreation: false },
  integer: { badValue: 'Bad integer!', refType: VALUE_REF },
  number: { badValue: 'Bad number!', refType: VALUE_REF },
  object: { badValue: 'Bad object!', refType: VALUE_REF, unknownRefShouldPassCreation: true },
  path: { badValue: {}, refType: VALUE_REF },
  string: { badValue: [], refType: VALUE_REF },
  type: { badValue: 'Bad type!', refType: VALUE_REF }
};

const TEST_REFERENCES = false;

function shouldThrowErrorOnBad(kind, validatorName, args, index, errorLike) {
  if (!(kind in argInfo)) {
    throw new Error(`Unknown type argument '${kind}'`);
  }
  const vld = V[validatorName];
  const testArgs = Array.from(args);
  it(`Should throw immediately an error on bad ${kind} as ${ordinal(index + 1)} argument`, () => {
    testArgs[index] = argInfo[kind].badValue;
    assert.throws(() => vld(...testArgs), errorLike || Error);
  });

  // Test references
  if (!TEST_REFERENCES) { return; } // Trick to disable the tests and make the build succeed
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

function shouldThrowErrorOnBadChild(validatorName, args, index, errorLike) {
  shouldThrowErrorOnBad('child', validatorName, args, index, errorLike);
}

export {
  shouldThrowErrorOnMissingArg,
  shouldThrowErrorOnBad,
  shouldThrowErrorOnBadChild
};
