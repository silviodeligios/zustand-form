import { describe, it, expect, vi } from "vitest";
import { cached } from "./cache";

describe("cached", () => {
  it("calls the factory only once for the same key", () => {
    const map = new Map<string, object>();
    const factory = vi.fn(() => ({ value: 42 }));

    cached(map, "key", factory);
    cached(map, "key", factory);
    cached(map, "key", factory);

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("returns the same reference on subsequent calls", () => {
    const map = new Map<string, object>();
    const result1 = cached(map, "key", () => ({ value: 1 }));
    const result2 = cached(map, "key", () => ({ value: 2 }));

    expect(result1).toBe(result2);
  });

  it("creates separate entries for different keys", () => {
    const map = new Map<string, object>();
    const a = cached(map, "a", () => ({ label: "a" }));
    const b = cached(map, "b", () => ({ label: "b" }));

    expect(a).not.toBe(b);
    expect((a as { label: string }).label).toBe("a");
    expect((b as { label: string }).label).toBe("b");
  });

  it("calls the factory when the map is empty", () => {
    const map = new Map<string, number>();
    const factory = vi.fn(() => 99);
    const result = cached(map, "x", factory);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(result).toBe(99);
  });
});
