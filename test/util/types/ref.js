import { assert } from 'chai';
import Context from '../../../src/util/context';
import { checkUniqueKey } from '../../../src/util/misc';
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

  const UNRESOLVABLE = {};

  function doEnsureRef(tInfo, refType, name, value) {
    const ctx = new Context();
    let obj = { [name]: value };
    if (refType === '$var') {
      if (value !== UNRESOLVABLE) {
        ctx.push(obj);
      }
      obj = {};
    } else if (refType !== '$path') {
      throw new Error(`Fix your test!!!! Unknown refType '${refType}. Expected either '$path' or '$var'.`);
    }
    const ref = tInfo.type.ensure({ [refType]: name });
    tInfo.type.ensureRef(ref, ctx, obj);
  }

  Object.keys(argInfo).forEach((k) => {
    const tInfo = argInfo[k];
    const testRefToValues = [];
    const testUnresolvedReferences = [];
    const mismatchedReferences = [];
    if (tInfo.acceptValueRef()) {
      testRefToValues.push(good => doEnsureRef(tInfo, '$path', 'a', tInfo.value(good)));
      testRefToValues.push(good => doEnsureRef(tInfo, '$var', 'a', tInfo.value(good)));
      testUnresolvedReferences.push(() => doEnsureRef(tInfo, '$var', 'V1', UNRESOLVABLE));
      mismatchedReferences.push({ $var: '$VALIDATOR' });
    }
    if (tInfo.acceptValidatorRef()) {
      testRefToValues.push(good => doEnsureRef(tInfo, '$var', '$V1', tInfo.value(good)));
      testUnresolvedReferences.push(() => doEnsureRef(tInfo, '$var', '$V1', UNRESOLVABLE));
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
