import { assert } from 'chai';
import V from '../src';

function shouldThrowErrorOnBadPath(validatorName, errorLike) {
  it('Should throw immediately an error on bad path', () => {
    assert.throws(() => V[validatorName](0), errorLike || Error);
  });
}

export {
  shouldThrowErrorOnBadPath as default
};
