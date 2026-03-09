import { describe, it, expect } from "vitest";
import {
  computeNewIndex,
  reindexPathKeyedRecord,
  reindexMap,
} from "./arrayReindex";

describe("computeNewIndex", () => {
  describe("remove", () => {
    it("returns null for the removed element", () => {
      expect(computeNewIndex(2, { type: "remove", index: 2 })).toBeNull();
    });

    it("decrements indices after the removed one", () => {
      expect(computeNewIndex(3, { type: "remove", index: 2 })).toBe(2);
      expect(computeNewIndex(4, { type: "remove", index: 2 })).toBe(3);
    });

    it("leaves indices before the removed one unchanged", () => {
      expect(computeNewIndex(1, { type: "remove", index: 2 })).toBe(1);
      expect(computeNewIndex(0, { type: "remove", index: 2 })).toBe(0);
    });
  });

  describe("insert", () => {
    it("increments indices from the insertion point onward", () => {
      expect(computeNewIndex(2, { type: "insert", index: 2 })).toBe(3);
      expect(computeNewIndex(3, { type: "insert", index: 2 })).toBe(4);
    });

    it("leaves indices before the insertion point unchanged", () => {
      expect(computeNewIndex(1, { type: "insert", index: 2 })).toBe(1);
      expect(computeNewIndex(0, { type: "insert", index: 2 })).toBe(0);
    });
  });

  describe("move", () => {
    it("from === to: nothing changes", () => {
      expect(computeNewIndex(2, { type: "move", from: 2, to: 2 })).toBe(2);
    });

    it("the moved element lands at the destination index", () => {
      expect(computeNewIndex(0, { type: "move", from: 0, to: 3 })).toBe(3);
    });

    it("move forward: elements in [from+1, to] shift back by one", () => {
      expect(computeNewIndex(1, { type: "move", from: 0, to: 3 })).toBe(0);
      expect(computeNewIndex(2, { type: "move", from: 0, to: 3 })).toBe(1);
      expect(computeNewIndex(3, { type: "move", from: 0, to: 3 })).toBe(2);
    });

    it("move backward: elements in [to, from-1] shift forward by one", () => {
      expect(computeNewIndex(3, { type: "move", from: 3, to: 0 })).toBe(0);
      expect(computeNewIndex(0, { type: "move", from: 3, to: 0 })).toBe(1);
      expect(computeNewIndex(1, { type: "move", from: 3, to: 0 })).toBe(2);
      expect(computeNewIndex(2, { type: "move", from: 3, to: 0 })).toBe(3);
    });

    it("elements outside the affected range are unchanged", () => {
      expect(computeNewIndex(4, { type: "move", from: 0, to: 3 })).toBe(4);
    });
  });

  describe("swap", () => {
    it("from === to: nothing changes", () => {
      expect(computeNewIndex(2, { type: "swap", from: 2, to: 2 })).toBe(2);
    });

    it("swaps the two indices", () => {
      expect(computeNewIndex(1, { type: "swap", from: 1, to: 3 })).toBe(3);
      expect(computeNewIndex(3, { type: "swap", from: 1, to: 3 })).toBe(1);
    });

    it("all other indices remain unchanged", () => {
      expect(computeNewIndex(0, { type: "swap", from: 1, to: 3 })).toBe(0);
      expect(computeNewIndex(2, { type: "swap", from: 1, to: 3 })).toBe(2);
    });
  });
});

describe("reindexPathKeyedRecord", () => {
  it("drops the removed element's keys and shifts the rest (remove)", () => {
    const record = {
      "items.0": true,
      "items.1": true,
      "items.2": true,
    };
    const result = reindexPathKeyedRecord(record, "items", {
      type: "remove",
      index: 1,
    });
    // items.1 is deleted; items.2 becomes items.1
    expect(result).toEqual({ "items.0": true, "items.1": true });
    expect(result["items.2"]).toBeUndefined();
  });

  it("reindexes correctly after remove", () => {
    const record = {
      "list.0.name": "Alice",
      "list.1.name": "Bob",
      "list.2.name": "Carol",
    };
    const result = reindexPathKeyedRecord(record, "list", {
      type: "remove",
      index: 0,
    });
    expect(result).toEqual({
      "list.0.name": "Bob",
      "list.1.name": "Carol",
    });
  });

  it("reindexes correctly after insert", () => {
    const record = {
      "list.0.name": "Alice",
      "list.1.name": "Bob",
    };
    const result = reindexPathKeyedRecord(record, "list", {
      type: "insert",
      index: 1,
    });
    expect(result).toEqual({
      "list.0.name": "Alice",
      "list.2.name": "Bob",
    });
  });

  it("preserves keys that do not belong to the target array", () => {
    const record = {
      "items.0": true,
      otherField: true,
      "other.0": true,
    };
    const result = reindexPathKeyedRecord(record, "items", {
      type: "remove",
      index: 0,
    });
    expect(result["otherField"]).toBe(true);
    expect(result["other.0"]).toBe(true);
  });

  it("preserves the array root key itself (e.g. 'items')", () => {
    const record = {
      items: true,
      "items.0": true,
    };
    const result = reindexPathKeyedRecord(record, "items", {
      type: "remove",
      index: 0,
    });
    expect(result["items"]).toBe(true);
  });

  describe("nested arrays", () => {
    it("remove on outer array carries all sub-paths of the removed element", () => {
      // users[0] has tags[0] and tags[1]; users[1] has tags[0]
      const record = {
        "users.0.name": "Alice",
        "users.0.tags.0": "a",
        "users.0.tags.1": "b",
        "users.1.name": "Bob",
        "users.1.tags.0": "c",
      };
      const result = reindexPathKeyedRecord(record, "users", {
        type: "remove",
        index: 0,
      });
      // users[1] shifts to users[0] with all its children; original users[0] is gone
      expect(result).toEqual({
        "users.0.name": "Bob",
        "users.0.tags.0": "c",
      });
      // old users[1].* must no longer exist
      expect(result["users.1.name"]).toBeUndefined();
      expect(result["users.1.tags.0"]).toBeUndefined();
    });

    it("remove on inner array is scoped to the specific element", () => {
      // Only users.0.tags is operated on — users.1.tags is left untouched
      const record = {
        "users.0.tags.0": "a",
        "users.0.tags.1": "b",
        "users.0.tags.2": "c",
        "users.1.tags.0": "x",
        "users.1.tags.1": "y",
      };
      const result = reindexPathKeyedRecord(record, "users.0.tags", {
        type: "remove",
        index: 1,
      });
      expect(result).toEqual({
        "users.0.tags.0": "a",
        "users.0.tags.1": "c", // was .2
        "users.1.tags.0": "x", // untouched
        "users.1.tags.1": "y", // untouched
      });
    });

    it("swap on outer array exchanges all sub-paths (matrix example)", () => {
      const record = {
        "matrix.0.0": "a00",
        "matrix.0.1": "a01",
        "matrix.1.0": "b10",
        "matrix.1.1": "b11",
        "matrix.2.0": "c20",
      };
      const result = reindexPathKeyedRecord(record, "matrix", {
        type: "swap",
        from: 0,
        to: 1,
      });
      expect(result).toEqual({
        "matrix.0.0": "b10",
        "matrix.0.1": "b11",
        "matrix.1.0": "a00",
        "matrix.1.1": "a01",
        "matrix.2.0": "c20", // untouched
      });
    });

    it("insert on outer array shifts sub-paths of subsequent elements", () => {
      const record = {
        "rows.0.cells.0": "r0c0",
        "rows.0.cells.1": "r0c1",
        "rows.1.cells.0": "r1c0",
      };
      const result = reindexPathKeyedRecord(record, "rows", {
        type: "insert",
        index: 1,
      });
      expect(result).toEqual({
        "rows.0.cells.0": "r0c0",
        "rows.0.cells.1": "r0c1",
        "rows.2.cells.0": "r1c0", // rows[1] → rows[2]
      });
    });

    it("move on outer array repositions all sub-paths", () => {
      const record = {
        "list.0.x": "zero-x",
        "list.0.y": "zero-y",
        "list.1.x": "one-x",
        "list.2.x": "two-x",
      };
      // move list[2] to position 0
      const result = reindexPathKeyedRecord(record, "list", {
        type: "move",
        from: 2,
        to: 0,
      });
      expect(result).toEqual({
        "list.0.x": "two-x",  // was list.2
        "list.1.x": "zero-x", // was list.0
        "list.1.y": "zero-y",
        "list.2.x": "one-x",  // was list.1
      });
    });
  });
});

describe("reindexMap", () => {
  it("removes the deleted element's keys and calls onRemove", () => {
    const map = new Map([
      ["list.0.name", "Alice"],
      ["list.1.name", "Bob"],
      ["list.2.name", "Carol"],
    ]);
    const removed: string[] = [];
    reindexMap(map, "list", { type: "remove", index: 1 }, (key) => {
      removed.push(key);
    });
    expect(map.get("list.0.name")).toBe("Alice");
    expect(map.get("list.1.name")).toBe("Carol");
    expect(map.has("list.2.name")).toBe(false);
    expect(removed).toContain("list.1.name");
  });

  it("calls onMove when a key is relocated", () => {
    const map = new Map([["list.1.name", "Bob"]]);
    const moves: [string, string][] = [];
    reindexMap(
      map,
      "list",
      { type: "remove", index: 0 },
      undefined,
      (oldKey, newKey) => {
        moves.push([oldKey, newKey]);
      },
    );
    expect(moves).toEqual([["list.1.name", "list.0.name"]]);
  });
});
