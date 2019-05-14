import { assert } from 'chai';
import V from '../src';
import ensureArg from '../src/util/ensure-arg';

const VALIDATOR_REF = 'vaidatorRef';
const VALUE_REF = 'valueRef';

const UNKNOWN_REF = Object.freeze({ $unknownRefType: 'anything' });

class ArgTestInfo {
  constructor(name, refType, goodValue) {
    this.name = name;
    this.refType = refType;
    this.goodValue = goodValue;
    this.badValue = refType === VALIDATOR_REF ? 'Bad validator!' : () => {};
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

  /*
  * Any argument accepting an object (for instance any, options, object)
  * considers an unknown ref like a good value, so cannot fail on validator creation
  */
  unknownRefShouldPassCreation() {
    if (this.acceptValueRef()) {
      try {
        return ensureArg[this.name](UNKNOWN_REF) === UNKNOWN_REF;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
}

const argInfo = [
  new ArgTestInfo('any', VALUE_REF, 1),
  new ArgTestInfo('array', VALUE_REF, []),
  new ArgTestInfo('child', VALIDATOR_REF, V.isSet('')),
  new ArgTestInfo('integer', VALUE_REF, 1),
  new ArgTestInfo('number', VALUE_REF, 1.2),
  new ArgTestInfo('object', VALUE_REF, {}),
  new ArgTestInfo('options', VALUE_REF, {}),
  new ArgTestInfo('path', VALUE_REF, 'a'),
  new ArgTestInfo('string', VALUE_REF, 'Hello'),
  new ArgTestInfo('stringOrArray', VALUE_REF, []),
  new ArgTestInfo('stringOrRegex', VALUE_REF, /.?/),
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

function testArgument0(vld, args, index, errorLike) {
  const kind = vld.owner.argDescriptors[vld.owner.adjustArgDescriptorIndex(index)].type;
  if (!(kind in argInfo)) {
    throw new Error(`Unknown type argument '${kind}'`);
  }
  const testArgs = Array.from(args);

  // Test unexpected value
  it(`Should throw immediately an error on bad ${kind} as ${ordinal(index + 1)} argument`, () => {
    testArgs[index] = argInfo[kind].badValue;
    assert.throws(() => vld(...testArgs), errorLike || Error);
  });

  // Test references
  if (argInfo[kind].refType) {
    if (argInfo[kind].unknownRefShouldPassCreation()) {
      it(`Should pass creation on unknown reference type as ${ordinal(index + 1)} argument`, () => {
        testArgs[index] = UNKNOWN_REF;
        assert(typeof vld(...testArgs) === 'function', ':(');
      });
    } else {
      it(`Should throw immediately an error on unknown reference type as ${ordinal(index + 1)} argument`, () => {
        testArgs[index] = UNKNOWN_REF;
        assert.throws(() => vld(...testArgs), errorLike || Error);
      });
    }
    ['$path', '$var'].forEach(refType => it(`Should delay ${refType} reference resolution at validation time for ${kind} as ${ordinal(index + 1)} argument`, () => {
      testArgs[index] = { [refType]: 'something' };
      assert(typeof vld(...testArgs) === 'function', ':(');
    }));
  }
}

function testArgument(kind, validatorName, args, index, errorLike) {
  const validator = V[validatorName];
  return testArgument0(validator, args, index, errorLike);
}

const VALIDATION = Object.freeze({
  SUCCESS: 'success',
  FAILURE: 'fail',
  THROW: 'throw an error',
  DO_NOT_THROW: 'not throw an error'
});

function testValidationAssert(expectedResult, vCreate, obj) {
  switch (expectedResult) {
    case VALIDATION.SUCCESS:
      assert(vCreate()(obj) === undefined, ':(');
      break;
    case VALIDATION.FAILURE:
      assert(vCreate()(obj) !== undefined, ':(');
      break;
    case VALIDATION.THROW:
      assert.throws(() => vCreate()(obj), Error);
      break;
    case VALIDATION.DO_NOT_THROW:
      assert.doesNotThrow(() => vCreate()(obj), Error);
      break;
    default:
      assert(false, 'Unknown expected result');
      break;
  }
}

function testAllArguments(v, args) {
  const len = Math.max(v.owner.argDescriptors.length, args.length);
  for (let i = 0; i < len; i += 1) {
    testArgument0(v, args, i);
  }
}

function testValidation(expectedResult, obj, vld, ...args) {
  const vFunc = typeof vld === 'function' ? vld : V[vld];
  const vName = typeof vld === 'function' ? vld.owner.name : vld;

  // Accept up to 3 expected results
  const expected = [].concat(expectedResult);
  const len = expected.length;
  expected.length = 3;
  expected.fill(expected[len - 1], len);

  it(`${vName}(${args.map(a => JSON.stringify(a)).join(', ')}) should ${expected[0]} for ${JSON.stringify(obj)}`, () => {
    const vCreate = () => vFunc(...args);
    testValidationAssert(expected[0], vCreate, obj);
  });

  // Test $var references
  const scope = args.reduce((acc, a, i) => {
    const kind = vld.owner.argDescriptors[vld.owner.adjustArgDescriptorIndex(i)].type;
    acc[`${argInfo[kind].acceptValidatorRef() ? '$' : ''}v${i}`] = a;
    return acc;
  }, {});
  const varArgs = args.map((a, i) => {
    const kind = vld.owner.argDescriptors[vld.owner.adjustArgDescriptorIndex(i)].type;
    return { $var: `${argInfo[kind].acceptValidatorRef() ? '$' : ''}v${i}` };
  });
  it(`${vName}(${varArgs.map(a => JSON.stringify(a)).join(', ')}) in scope ${JSON.stringify(scope)} should ${expected[1]} for ${JSON.stringify(obj)}`, () => {
    const vCreate = () => V.def(scope, vFunc(...varArgs));
    testValidationAssert(expected[1], vCreate, obj);
  });

  // Test $path references
  const obj2 = args.reduce((acc, a, i) => {
    const kind = vld.owner.argDescriptors[vld.owner.adjustArgDescriptorIndex(i)].type;
    if (!argInfo[kind].acceptValidatorRef()) {
      acc[`_${i}`] = a;
    }
    return acc;
  }, clone(obj));
  const pathArgs = args.map((a, i) => {
    const kind = vld.owner.argDescriptors[vld.owner.adjustArgDescriptorIndex(i)].type;
    return argInfo[kind].acceptValidatorRef() ? a : { $path: `_${i}` };
  });
  it(`${vName}(${pathArgs.map(a => JSON.stringify(a)).join(', ')}) should ${expected[2]} for ${JSON.stringify(obj2)}`, () => {
    const vCreate = () => vFunc(...pathArgs);
    testValidationAssert(expected[2], vCreate, obj2);
  });
}

export {
  argInfo,
  clone,
  shouldThrowErrorOnMissingArg,
  testArgument,
  testAllArguments,
  testValidation,
  VALIDATION
};
