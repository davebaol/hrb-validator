import { V } from '../../src';
import { testAllArguments, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE } = VALIDATION;

describe('Test branch validator call$.', () => {
  const args = ['', V.isSet$('a')];
  testAllArguments(V.call$, args);
  testValidation(SUCCESS, { a: -3.14 }, V.call$, 'a', { isType$: ['', 'number'] });
  testValidation(FAILURE, { a: '-3.14' }, V.call$, 'a', { isType$: ['', 'number'] });
  testValidation(FAILURE, {}, V.call$, 'a', { isType$: ['', 'number'] });
});
