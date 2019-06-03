import { assert } from 'chai';
import Context from '../../../src/util/context';
import Reference from '../../../src/util/reference';
import { checkUniqueKey } from '../../../src/util/misc';
import { ensureScope, ensureScopeRef } from '../../../src/util/ensure-scope';
import { argInfo } from '../../test-utils';

describe('Test references for all kinds of arguments', () => {
  function testMismatchedReferences(tInfo, ref) {
    const k = checkUniqueKey(ref);
    const ctx = new Context();
    return () => {
      const scope = { [ref[k]]: tInfo.goodValue };
      let s = ensureScope(scope);
      let r = tInfo.type.ensure(ref);
      return () => {
        const obj = { [ref[k]]: tInfo.goodValue };
        // Code taken from def
        if (s === scope) {
          throw new Error('Fix your test!!!! For this test the scope MUST contain a reference');
        }
        const freshScope = {};
        ctx.push(freshScope);
        s = ensureScopeRef(freshScope, s, ctx, obj);
        if (r instanceof Reference) {
          r = tInfo.type.ensureRef(r, ctx, obj);
        } else {
          throw new Error('Fix your test!!!! For this test is needed');
        }
      };
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
    if (ref.error) {
      throw new Error(ref.error);
    }
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
      it(`${k} should not return an error on a reference to a good value`, () => {
        assert.doesNotThrow(() => f(true), Error);
      });
      it(`${k} should return an error on a reference to a bad value`, () => {
        assert.throws(() => f(false), Error);
      });
    });

    testUnresolvedReferences.forEach((f) => {
      it(`${k} should return an error on unresolved reference`, () => {
        assert.throws(f, Error, 'Unresolved');
      });
    });

    if (!(tInfo.acceptValidatorRef() && tInfo.acceptValueRef())) {
      if (testMismatchedReferences) {
        console.log('testMismatchedReferences temporarily skipped');
      }
      /*
      mismatchedReferences.forEach(ref =>
        it(`${k} should throw an error on mismatched ref ${JSON.stringify(ref)}`, () => {
        assert.throws(testMismatchedReferences(tInfo, ref), Error, 'Unexpected reference');
      }));
      */
    }

    it(`${k} should throw an error on unknown ref`, () => {
      assert.throws(() => tInfo.type.ensureRef({ $unknown: 'unknown' }, {}), Error);
    });
  });
});
