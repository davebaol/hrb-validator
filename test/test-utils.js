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

const badValues = {
  array: "I'm a bad array!",
  child: "I'm a bad child!",
  object: "I'm a bad object!",
  path: { badPath: true }
};

function shouldThrowErrorOnBad(type, validatorName, args, index, errorLike) {
  if (!(type in badValues)) {
    throw new Error(`Unknown bad argument of type '${type}'`);
  }
  const badArgs = Array.from(args);
  badArgs[index] = badValues[type];
  it(`Should throw immediately an error on bad ${type} as ${ordinal(index + 1)} argument`, () => {
    assert.throws(() => V[validatorName](...badArgs), errorLike || Error);
  });
}

function shouldThrowErrorOnBadPath(validatorName, errorLike) {
  shouldThrowErrorOnBad('path', validatorName, [], 0, errorLike);
}

function shouldThrowErrorOnBadChild(validatorName, args, index, errorLike) {
  shouldThrowErrorOnBad('child', validatorName, args, index, errorLike);
}

export {
  shouldThrowErrorOnMissingArg,
  shouldThrowErrorOnBad,
  shouldThrowErrorOnBadPath,
  shouldThrowErrorOnBadChild
};
