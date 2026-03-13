import { describe, it, expect } from "vitest";
import {
  isArrayKey,
  indexPathToKeyPath,
  keyPathToIndexPath,
  scanArrayKeys,
  removeByPrefix,
  removeKeyedEntries,
  removeNestedArrayKeys,
  generateKey,
  getValueAtKeyPath,
} from "./arrayKeys";

describe("isArrayKey", () => {
  it("recognizes valid array keys", () => {
    expect(isArrayKey("_k0")).toBe(true);
    expect(isArrayKey("_k42")).toBe(true);
    expect(isArrayKey("_k999")).toBe(true);
  });

  it("rejects non-keys", () => {
    expect(isArrayKey("0")).toBe(false);
    expect(isArrayKey("name")).toBe(false);
    expect(isArrayKey("_k")).toBe(false);
    expect(isArrayKey("_kx")).toBe(false);
    expect(isArrayKey("k0")).toBe(false);
  });
});

describe("indexPathToKeyPath", () => {
  const arrayKeys = {
    items: ["_k0", "_k1", "_k2"],
    "items._k0.tags": ["_k3", "_k4"],
  };

  it("translates simple array index", () => {
    expect(indexPathToKeyPath("items.0.name", arrayKeys)).toBe("items._k0.name");
    expect(indexPathToKeyPath("items.2", arrayKeys)).toBe("items._k2");
  });

  it("translates nested arrays", () => {
    expect(indexPathToKeyPath("items.0.tags.1.label", arrayKeys)).toBe(
      "items._k0.tags._k4.label",
    );
  });

  it("passes through already key-based paths", () => {
    expect(indexPathToKeyPath("items._k0.name", arrayKeys)).toBe("items._k0.name");
  });

  it("preserves non-array paths", () => {
    expect(indexPathToKeyPath("name", arrayKeys)).toBe("name");
    expect(indexPathToKeyPath("address.street", arrayKeys)).toBe("address.street");
  });

  it("handles out-of-bounds index", () => {
    expect(indexPathToKeyPath("items.10.name", arrayKeys)).toBe("items.10.name");
  });
});

describe("keyPathToIndexPath", () => {
  const arrayKeys = {
    items: ["_k0", "_k1", "_k2"],
    "items._k0.tags": ["_k3", "_k4"],
  };

  it("translates key-based path to index-based", () => {
    expect(keyPathToIndexPath("items._k0.name", arrayKeys)).toBe("items.0.name");
    expect(keyPathToIndexPath("items._k2", arrayKeys)).toBe("items.2");
  });

  it("translates nested arrays", () => {
    expect(keyPathToIndexPath("items._k0.tags._k4.label", arrayKeys)).toBe(
      "items.0.tags.1.label",
    );
  });

  it("passes through already index-based paths", () => {
    expect(keyPathToIndexPath("items.0.name", arrayKeys)).toBe("items.0.name");
  });

  it("preserves non-array paths", () => {
    expect(keyPathToIndexPath("name", arrayKeys)).toBe("name");
  });
});

describe("indexPathToKeyPath and keyPathToIndexPath are inverses", () => {
  const arrayKeys = {
    items: ["_k0", "_k1"],
    "items._k0.tags": ["_k2", "_k3"],
  };

  it("round-trips index→key→index", () => {
    const path = "items.0.tags.1.label";
    const keyPath = indexPathToKeyPath(path, arrayKeys);
    const indexPath = keyPathToIndexPath(keyPath, arrayKeys);
    expect(indexPath).toBe(path);
  });

  it("round-trips key→index→key", () => {
    const path = "items._k0.tags._k3.label";
    const indexPath = keyPathToIndexPath(path, arrayKeys);
    const keyPath = indexPathToKeyPath(indexPath, arrayKeys);
    expect(keyPath).toBe(path);
  });
});

describe("scanArrayKeys", () => {
  it("scans a simple array", () => {
    const values = { items: ["a", "b", "c"] };
    const { arrayKeys, nextCounter } = scanArrayKeys(values, "", 0);
    expect(arrayKeys).toEqual({ items: ["_k0", "_k1", "_k2"] });
    expect(nextCounter).toBe(3);
  });

  it("scans nested arrays (depth-first counter)", () => {
    const values = {
      items: [
        { tags: ["x", "y"] },
        { tags: ["z"] },
      ],
    };
    const { arrayKeys, nextCounter } = scanArrayKeys(values, "", 0);
    // Counter increments depth-first: _k0 (item 0), _k1/_k2 (tags of item 0),
    // _k3 (item 1), _k4 (tags of item 1)
    expect(arrayKeys["items"]).toEqual(["_k0", "_k3"]);
    expect(arrayKeys["items._k0.tags"]).toEqual(["_k1", "_k2"]);
    expect(arrayKeys["items._k3.tags"]).toEqual(["_k4"]);
    expect(nextCounter).toBe(5);
  });

  it("handles empty arrays", () => {
    const values = { items: [] as unknown[] };
    const { arrayKeys } = scanArrayKeys(values, "", 0);
    expect(arrayKeys).toEqual({ items: [] });
  });

  it("handles non-array values", () => {
    const values = { name: "test", address: { city: "Rome" } };
    const { arrayKeys, nextCounter } = scanArrayKeys(values, "", 0);
    expect(arrayKeys).toEqual({});
    expect(nextCounter).toBe(0);
  });

  it("uses custom start counter", () => {
    const values = { items: ["a"] };
    const { arrayKeys, nextCounter } = scanArrayKeys(values, "", 10);
    expect(arrayKeys).toEqual({ items: ["_k10"] });
    expect(nextCounter).toBe(11);
  });

  it("scans a subtree with parent key path", () => {
    const value = { tags: ["a", "b"] };
    const { arrayKeys, nextCounter } = scanArrayKeys(value, "items._k0", 0);
    expect(arrayKeys["items._k0.tags"]).toEqual(["_k0", "_k1"]);
    expect(nextCounter).toBe(2);
  });
});

describe("getValueAtKeyPath", () => {
  it("gets value via key-to-index translation", () => {
    const values = { items: [{ name: "A" }, { name: "B" }] };
    const arrayKeys = { items: ["_k0", "_k1"] };
    expect(getValueAtKeyPath(values, "items._k0.name", arrayKeys)).toBe("A");
    expect(getValueAtKeyPath(values, "items._k1.name", arrayKeys)).toBe("B");
  });

  it("works after reorder (keys swapped, values reordered)", () => {
    const values = { items: [{ name: "B" }, { name: "A" }] };
    const arrayKeys = { items: ["_k1", "_k0"] };
    expect(getValueAtKeyPath(values, "items._k1.name", arrayKeys)).toBe("B");
    expect(getValueAtKeyPath(values, "items._k0.name", arrayKeys)).toBe("A");
  });
});

describe("removeByPrefix", () => {
  it("removes entries matching prefix", () => {
    const record = {
      "items._k0.name": true,
      "items._k0.age": true,
      "items._k1.name": true,
      other: true,
    };
    const result = removeByPrefix(record, "items._k0");
    expect(result).toEqual({
      "items._k1.name": true,
      other: true,
    });
  });

  it("returns same record if no matches", () => {
    const record = { "items._k1.name": true };
    const result = removeByPrefix(record, "items._k0");
    expect(result).toBe(record);
  });

  it("removes exact match and children", () => {
    const record = { items: true, "items._k0": true, other: true };
    const result = removeByPrefix(record, "items");
    expect(result).toEqual({ other: true });
  });

  it("works for arrayKeys-style records", () => {
    const ak: Record<string, string[]> = {
      items: ["_k0", "_k1"],
      "items._k0.tags": ["_k2", "_k3"],
      "items._k0.tags._k2.nested": ["_k4"],
      "items._k1.tags": ["_k5"],
    };
    const result = removeByPrefix(ak, "items._k0");
    expect(result).toEqual({
      items: ["_k0", "_k1"],
      "items._k1.tags": ["_k5"],
    });
  });
});

describe("deprecated aliases", () => {
  it("removeKeyedEntries is an alias for removeByPrefix", () => {
    expect(removeKeyedEntries).toBe(removeByPrefix);
  });

  it("removeNestedArrayKeys is an alias for removeByPrefix", () => {
    expect(removeNestedArrayKeys).toBe(removeByPrefix);
  });
});

describe("generateKey", () => {
  it("generates a key and increments counter", () => {
    const { key, nextCounter } = generateKey(0);
    expect(key).toBe("_k0");
    expect(nextCounter).toBe(1);
  });

  it("uses provided counter", () => {
    const { key, nextCounter } = generateKey(42);
    expect(key).toBe("_k42");
    expect(nextCounter).toBe(43);
  });
});
