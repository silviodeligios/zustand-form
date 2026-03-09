import { describe, it, expect } from "vitest";
import { isEqual, isThenable } from "./compare";

describe("isEqual", () => {
  it("equal primitives", () => {
    expect(isEqual(1, 1)).toBe(true);
    expect(isEqual("a", "a")).toBe(true);
    expect(isEqual(true, true)).toBe(true);
  });

  it("different primitives", () => {
    expect(isEqual(1, 2)).toBe(false);
    expect(isEqual("a", "b")).toBe(false);
  });

  it("null and undefined", () => {
    expect(isEqual(null, null)).toBe(true);
    expect(isEqual(undefined, undefined)).toBe(true);
    expect(isEqual(null, undefined)).toBe(false);
    expect(isEqual(null, 0)).toBe(false);
  });

  it("shallow-equal objects", () => {
    expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it("objects with different values", () => {
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("objects with different keys", () => {
    expect(isEqual({ a: 1 }, { b: 1 })).toBe(false);
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("deeply equal nested objects", () => {
    expect(isEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(true);
  });

  it("different nested objects", () => {
    expect(isEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  });

  it("equal arrays", () => {
    expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it("different arrays", () => {
    expect(isEqual([1, 2], [1, 3])).toBe(false);
    expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("array vs plain object", () => {
    expect(isEqual([], {})).toBe(false);
  });

  it("different types", () => {
    expect(isEqual(1, "1")).toBe(false);
  });
});

describe("isThenable", () => {
  it("a Promise is thenable", () => {
    expect(isThenable(Promise.resolve())).toBe(true);
  });

  it("an object with a .then function is thenable", () => {
    expect(isThenable({ then: () => {} })).toBe(true);
  });

  it("primitives are not thenable", () => {
    expect(isThenable(1)).toBe(false);
    expect(isThenable("hello")).toBe(false);
    expect(isThenable(null)).toBe(false);
    expect(isThenable(undefined)).toBe(false);
  });

  it("a plain object without .then is not thenable", () => {
    expect(isThenable({ foo: "bar" })).toBe(false);
  });

  it("an object with a non-function .then is not thenable", () => {
    expect(isThenable({ then: "not a function" })).toBe(false);
  });
});
