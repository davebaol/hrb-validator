import { assert } from 'chai';
import Scope from '../../../src/util/scope';
import { checkUniqueKey } from '../../../src/util/misc';
import { argInfo } from '../../test-utils';

describe('Test references for all kinds of arguments', () => {
  function testMismatchedReferences(tInfo, ref) {
    const k = checkUniqueKey(ref);
    return () => {
      const resources = { [ref[k]]: tInfo.goodValue };
      const scope = Scope.compile(resources);
      const rExpr = tInfo.type.compile(ref);
      return () => {
        const obj = { [ref[k]]: tInfo.goodValue };
        // Code taken from def
        if (scope.resolved) {
          throw new Error('Fix your test!!!! For this test the scope MUST contain a reference');
        }
        scope.resolve(obj);
        if (rExpr.resolved) {
          throw new Error('Fix your test!!!! For this test a reference is needed');
        }
        tInfo.type.resolve(rExpr, scope, obj);
      };
    };
  }

  const UNRESOLVABLE = {};

  function compileAndResolve(tInfo, refType, name, value) {
    const scope = new Scope();
    let obj = { [name]: value };
    if (refType === '$var') {
      if (value !== UNRESOLVABLE) {
        scope.resources = obj;
      }
      obj = {};
    } else if (refType !== '$path') {
      throw new Error(`Fix your test!!!! Unknown refType '${refType}. Expected either '$path' or '$var'.`);
    }
    const expr = tInfo.type.compile({ [refType]: name });
    tInfo.type.resolve(expr, scope, obj);
    if (expr.error) {
      throw new Error(expr.error);
    }
  }

  Object.keys(argInfo).forEach((k) => {
    const tInfo = argInfo[k];
    const testRefToValues = [];
    const testUnresolvedReferences = [];
    const mismatchedReferences = [];
    if (tInfo.acceptValueRef()) {
      testRefToValues.push(good => compileAndResolve(tInfo, '$path', 'a', tInfo.value(good)));
      testRefToValues.push(good => compileAndResolve(tInfo, '$var', 'a', tInfo.value(good)));
      testUnresolvedReferences.push(() => compileAndResolve(tInfo, '$var', 'V1', UNRESOLVABLE));
      mismatchedReferences.push({ $var: '$VALIDATOR' });
    }
    if (tInfo.acceptValidatorRef()) {
      testRefToValues.push(good => compileAndResolve(tInfo, '$var', '$V1', tInfo.value(good)));
      testUnresolvedReferences.push(() => compileAndResolve(tInfo, '$var', '$V1', UNRESOLVABLE));
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
      assert.throws(() => tInfo.type.resolve({ $unknown: 'unknown' }, {}), Error);
    });
  });
});
