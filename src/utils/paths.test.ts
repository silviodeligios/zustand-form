import { describe, it, expect } from "vitest";
import { hasPath, getIn, setIn } from "./paths";

describe("hasPath", () => {
  it("returns true for a top-level key", () => {
    expect(hasPath({ a: 1 }, "a")).toBe(true);
  });

  it("returns true for a nested path", () => {
    expect(hasPath({ a: { b: { c: 42 } } }, "a.b.c")).toBe(true);
  });

  it("returns true for an array index", () => {
    expect(hasPath({ items: ["x", "y"] }, "items.1")).toBe(true);
  });

  it("returns false for a missing key", () => {
    expect(hasPath({ a: 1 }, "b")).toBe(false);
  });

  it("returns false for a missing nested path", () => {
    expect(hasPath({ a: { b: 1 } }, "a.c")).toBe(false);
  });

  it("returns false when an intermediate is null", () => {
    expect(hasPath({ a: null }, "a.b")).toBe(false);
  });

  it("returns false for an out-of-bounds array index", () => {
    expect(hasPath({ items: ["x"] }, "items.2")).toBe(false);
  });

  it("returns true even when the value is undefined", () => {
    expect(hasPath({ a: undefined }, "a")).toBe(true);
  });

  it("returns false when root is null", () => {
    expect(hasPath(null, "a")).toBe(false);
  });
});

describe("getIn", () => {
  it("reads a top-level key", () => {
    expect(getIn({ a: 1 }, "a")).toBe(1);
  });

  it("reads a deeply nested path", () => {
    expect(getIn({ a: { b: { c: 42 } } }, "a.b.c")).toBe(42);
  });

  it("reads an array index", () => {
    expect(getIn({ items: ["x", "y"] }, "items.1")).toBe("y");
  });

  it("returns undefined for a missing path", () => {
    expect(getIn({ a: 1 }, "b.c")).toBeUndefined();
  });

  it("returns undefined when an intermediate value is null", () => {
    expect(getIn({ a: null }, "a.b")).toBeUndefined();
  });

  it("returns undefined when the root object is null", () => {
    expect(getIn(null, "a")).toBeUndefined();
  });
});

describe("setIn", () => {
  it("sets a top-level key", () => {
    const result = setIn({ a: 1 }, "a", 2);
    expect(result).toEqual({ a: 2 });
  });

  it("sets a nested path", () => {
    const result = setIn({ a: { b: 1 } }, "a.b", 99);
    expect(result).toEqual({ a: { b: 99 } });
  });

  it("creates missing intermediate objects", () => {
    const result = setIn({} as Record<string, unknown>, "a.b.c", "hello");
    expect(result).toEqual({ a: { b: { c: "hello" } } });
  });

  it("structural sharing: untouched nodes keep the same reference", () => {
    const original = { a: { x: 1 }, b: { y: 2 } };
    const result = setIn(original, "a.x", 99);
    expect((result as typeof original).b).toBe(original.b);
  });

  it("sets a value inside an array", () => {
    const result = setIn({ items: ["a", "b", "c"] }, "items.1", "z");
    expect(result).toEqual({ items: ["a", "z", "c"] });
  });

  it("adds a new key without touching existing ones", () => {
    const original = { a: 1 };
    const result = setIn(original, "b", 2);
    expect(result).toEqual({ a: 1, b: 2 });
    expect((result as Record<string, unknown>)["a"]).toBe(1);
  });
});
