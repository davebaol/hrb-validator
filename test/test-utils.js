import { assert } from 'chai';
import V from '../src';

function shouldThrowErrorOnBadPath(validatorName, errorLike) {
  it('Should throw immediately an error on bad path as 1st argument', () => {
    assert.throws(() => V[validatorName](0), errorLike || Error);
  });
}

function ordinal(n) {
  switch (n) {
    case 1: return '1st';
    case 2: return '2nd';
    case 3: return '3rd';
    default: return `${n}th`;
  }
}
function shouldThrowErrorOnBadChild(validatorName, args, index, errorLike) {
  const badArgs = args.map((a, i) => (i === index ? "I'm a bad child!" : a));
  it(`Should throw immediately an error on bad child as ${ordinal(index + 1)} argument`, () => {
    assert.throws(() => V[validatorName](...badArgs), errorLike || Error);
  });
}

export {
  shouldThrowErrorOnBadPath,
  shouldThrowErrorOnBadChild
};
