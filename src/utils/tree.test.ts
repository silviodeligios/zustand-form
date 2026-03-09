import { describe, it, expect } from "vitest";
import { filterByPrefix, treeMatcher } from "./tree";

describe("filterByPrefix", () => {
  const record = {
    a: 1,
    "a.b": 2,
    "a.b.c": 3,
    ab: 4,
    b: 5,
    "b.a": 6,
  };

  it("keeps only keys matching the prefix exactly or as a nested path", () => {
    expect(filterByPrefix(record, "a")).toEqual({ a: 1, "a.b": 2, "a.b.c": 3 });
  });

  it("does not include keys that start with the prefix but lack a dot separator", () => {
    expect(filterByPrefix(record, "a")).not.toHaveProperty("ab");
  });

  it("without a prefix returns a shallow copy of the record", () => {
    expect(filterByPrefix(record)).toEqual(record);
    expect(filterByPrefix(record)).not.toBe(record);
  });

  it("returns an empty object when the prefix does not match any key", () => {
    expect(filterByPrefix(record, "z")).toEqual({});
  });

  it("matches an exact prefix with no children", () => {
    expect(filterByPrefix(record, "b.a")).toEqual({ "b.a": 6 });
  });
});

describe("treeMatcher", () => {
  it("without a prefix matches any key", () => {
    const match = treeMatcher();
    expect(match("a")).toBe(true);
    expect(match("anything")).toBe(true);
  });

  it("matches the exact prefix", () => {
    const match = treeMatcher("user");
    expect(match("user")).toBe(true);
  });

  it("matches nested keys separated by a dot", () => {
    const match = treeMatcher("user");
    expect(match("user.name")).toBe(true);
    expect(match("user.address.city")).toBe(true);
  });

  it("does not match partial prefixes without a dot", () => {
    const match = treeMatcher("user");
    expect(match("username")).toBe(false);
  });

  it("does not match keys from other branches", () => {
    const match = treeMatcher("user");
    expect(match("order")).toBe(false);
    expect(match("order.user")).toBe(false);
  });
});
