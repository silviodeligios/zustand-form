import { describe, it, expect } from "vitest";
import { treeMatcher } from "./tree";

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
