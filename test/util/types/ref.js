import { assert } from 'chai';
import Context from '../../../src/util/context';
import checkUniqueKey from '../../../src/util/check-unique-key';
import prepareScope from '../../../src/util/prepare-scope';
import { argInfo } from '../../test-utils';

describe('Test references for all kinds of arguments', () => {
  function testMismatchedReferences(tInfo, ref) {
    const k = checkUniqueKey(ref);
    const ctx = new Context();
    return () => {
      ctx.push(prepareScope({ [ref[k]]: tInfo.goodValue }));
      return () => tInfo.type.ensureRef(ref, ctx, { [ref[k]]: tInfo.goodValue });
    };
  }

  Object.keys(argInfo).forEach((k) => {
    const tInfo = argInfo[k];
    const testRefToValues = [];
    const testUnresolvedReferences = [];
    const mismatchedReferences = [];
    console.log('tInfo.acceptValueRef()', tInfo.acceptValueRef());
    console.log('tInfo.acceptValidatorRef()', tInfo.acceptValidatorRef());
    if (tInfo.acceptValueRef()) {
      testRefToValues.push((good) => {
        const obj = { a: tInfo.value(good) };
        const ref = { $path: 'a' };
        tInfo.type.ensureRef(ref, new Context(), obj);
      });
      testRefToValues.push((good) => {
        const ctx = new Context();
        ctx.push({ a: tInfo.value(good) });
        const ref = { $var: 'a' };
        tInfo.type.ensureRef(ref, ctx, {});
      });
      testUnresolvedReferences.push(() => {
        const ref = { $var: 'V1' };
        tInfo.type.ensureRef(ref, new Context(), {});
      });
      mismatchedReferences.push({ $var: '$VALIDATOR' });
    }
    if (tInfo.acceptValidatorRef()) {
      testRefToValues.push((good) => {
        const ctx = new Context();
        ctx.push({ $V1: tInfo.value(good) });
        const ref = { $var: '$V1' };
        tInfo.type.ensureRef(ref, ctx);
      });
      testUnresolvedReferences.push(() => {
        // For now this fails as expected just because variable reference is not implemented yet
        const ref = { $var: '$V1' };
        tInfo.type.ensureRef(ref, new Context());
      });
      mismatchedReferences.push({ $path: 'a' });
      mismatchedReferences.push({ $var: 'VARIABLE' });
    }

    testRefToValues.forEach((f) => {
      it(`${k} should not throw an error on a reference to a good value`, () => {
        assert.doesNotThrow(() => f(true), Error);
      });
      it(`${k} should throw an error on a reference to a bad value`, () => {
        assert.throws(() => f(false), Error);
      });
    });

    testUnresolvedReferences.forEach((f) => {
      it(`${k} should throw an error on unresolved reference`, () => {
        assert.throws(f, Error, 'Unresolved');
      });
    });

    if (!(tInfo.acceptValidatorRef() && tInfo.acceptValueRef())) {
      mismatchedReferences.forEach(ref => it(`${k} should throw an error on mismatched ref ${JSON.stringify(ref)}`, () => {
        assert.throws(testMismatchedReferences(tInfo, ref), Error);
      }));
    }

    it(`${k} should throw an error on unknown ref`, () => {
      assert.throws(() => tInfo.type.ensureRef({ $unknown: 'unknown' }, {}), Error);
    });
  });
});
