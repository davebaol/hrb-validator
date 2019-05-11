import { testArgument, testValidation, VALIDATION } from '../test-utils';

const { SUCCESS, FAILURE } = VALIDATION;

const successExpected = [[false, false], [0, 0], ['foo', 'foo']];
const failureExpected = [[false, true], [0, 1], ['foo', 'bar'], [{}, {}], [[], []]];

describe('Test leaf validator equals.', () => {
  testArgument('path', 'equals', ['', 2], 0);
  successExpected.forEach(pair => testValidation(SUCCESS, { a: pair[0] }, 'equals', 'a', pair[1]));
  failureExpected.forEach(pair => testValidation(FAILURE, { a: pair[0] }, 'equals', 'a', pair[1]));
});
