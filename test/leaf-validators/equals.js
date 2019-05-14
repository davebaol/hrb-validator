import { testAllArguments, testValidation, VALIDATION } from '../test-utils';
import V from '../../src';

const { SUCCESS, FAILURE } = VALIDATION;

const successExpected = [[false, false], [0, 0], ['foo', 'foo']];
const failureExpected = [[false, true], [0, 1], ['foo', 'bar'], [{}, {}], [[], []]];

describe('Test leaf validator equals.', () => {
  testAllArguments(V.equals, ['', 2]);
  successExpected.forEach(pair => testValidation(SUCCESS, { a: pair[0] }, V.equals, 'a', pair[1]));
  failureExpected.forEach(pair => testValidation(FAILURE, { a: pair[0] }, V.equals, 'a', pair[1]));
});
