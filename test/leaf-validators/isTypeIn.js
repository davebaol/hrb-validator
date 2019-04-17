import { assert } from 'chai';
import V from '../../src';

describe('Test leaf validator isTypeIn.', () => {
  it('isTypeIn("a", ["boolean","array"]) should succeed for {a:false}', () => {
    const v = V.isTypeIn('a', ["boolean","array"]);
    assert(v({ a: false }) === undefined, ':(');
  });
  it('isTypeIn("a", ["boolean","array"]) should succeed for {a:[]}', () => {
    const v = V.isTypeIn('a', ["boolean","array"]);
    assert(v({ a: [] }) === undefined, ':(');
  });
  it('isTypeIn("a", ["boolean","array"]) should fail for {a:"..."}', () => {
    const v = V.isTypeIn('a', ["boolean","array"]);
    assert(v({ a: "..." }) !== undefined, ':(');
  });
});
