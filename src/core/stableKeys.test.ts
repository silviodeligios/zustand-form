import { describe, it, expect } from "vitest";
import { createForm } from "./createForm";

interface FormValues {
  items: { name: string; value: number }[];
  nested: { tags: string[] }[];
}

function makeForm(items: FormValues["items"] = [], nested: FormValues["nested"] = []) {
  return createForm<FormValues>({
    initialState: { values: { items, nested } },
  });
}

describe("stable array keys - initialization", () => {
  it("initializes arrayKeys from values", () => {
    const form = makeForm([{ name: "a", value: 1 }, { name: "b", value: 2 }]);
    const state = form.getState();
    expect(state.arrayKeys["items"]).toHaveLength(2);
    expect(state.arrayKeys["items"]![0]).toMatch(/^_k\d+$/);
    expect(state.arrayKeys["items"]![1]).toMatch(/^_k\d+$/);
    expect(state.arrayKeys["items"]![0]).not.toBe(state.arrayKeys["items"]![1]);
  });

  it("initializes arrayKeys for nested arrays", () => {
    const form = makeForm([], [{ tags: ["x", "y"] }]);
    const state = form.getState();
    expect(state.arrayKeys["nested"]).toHaveLength(1);
    const nestedKey = state.arrayKeys["nested"]![0]!;
    expect(state.arrayKeys[`nested.${nestedKey}.tags`]).toHaveLength(2);
  });
});

describe("stable array keys - append", () => {
  it("generates a new key on append", () => {
    const form = makeForm([{ name: "a", value: 1 }]);
    const keysBefore = form.getState().arrayKeys["items"]!;
    form.fieldArray.append("items", { name: "b", value: 2 });
    const keysAfter = form.getState().arrayKeys["items"]!;
    expect(keysAfter).toHaveLength(2);
    expect(keysAfter[0]).toBe(keysBefore[0]);
    expect(keysAfter[1]).not.toBe(keysBefore[0]);
  });
});

describe("stable array keys - remove", () => {
  it("removes the key at the given index", () => {
    const form = makeForm([{ name: "a", value: 1 }, { name: "b", value: 2 }]);
    const keysBefore = [...form.getState().arrayKeys["items"]!];
    form.fieldArray.remove("items", 0);
    const keysAfter = form.getState().arrayKeys["items"]!;
    expect(keysAfter).toHaveLength(1);
    expect(keysAfter[0]).toBe(keysBefore[1]);
  });

  it("cleans up metadata for removed element", () => {
    const form = makeForm([{ name: "a", value: 1 }, { name: "b", value: 2 }]);
    const key0 = form.getState().arrayKeys["items"]![0]!;

    // Set dirty on first element
    form.field.setValue(`items.${key0}.name`, "modified");
    expect(form.getState().dirtyFields[`items.${key0}.name`]).toBe(true);

    // Remove first element
    form.fieldArray.remove("items", 0);

    // Metadata for removed key should be gone
    expect(form.getState().dirtyFields[`items.${key0}.name`]).toBeUndefined();
  });
});

describe("stable array keys - move", () => {
  it("reorders keys without changing metadata paths", () => {
    const form = makeForm([
      { name: "a", value: 1 },
      { name: "b", value: 2 },
      { name: "c", value: 3 },
    ]);
    const keysBefore = [...form.getState().arrayKeys["items"]!];

    // Mark first element as dirty
    form.field.setValue(`items.${keysBefore[0]}.name`, "modified");
    expect(form.getState().dirtyFields[`items.${keysBefore[0]}.name`]).toBe(true);

    // Move first element to last position
    form.fieldArray.move("items", 0, 2);

    const keysAfter = form.getState().arrayKeys["items"]!;
    // Keys should be reordered: [_k1, _k2, _k0]
    expect(keysAfter[0]).toBe(keysBefore[1]);
    expect(keysAfter[1]).toBe(keysBefore[2]);
    expect(keysAfter[2]).toBe(keysBefore[0]);

    // Dirty metadata should still be on the SAME KEY (stable!)
    expect(form.getState().dirtyFields[`items.${keysBefore[0]}.name`]).toBe(true);

    // Values should reflect the move
    expect(form.getValues().items[2]!.name).toBe("modified");
  });
});

describe("stable array keys - swap", () => {
  it("swaps keys without changing metadata paths", () => {
    const form = makeForm([
      { name: "a", value: 1 },
      { name: "b", value: 2 },
    ]);
    const keysBefore = [...form.getState().arrayKeys["items"]!];

    form.field.setValue(`items.${keysBefore[0]}.name`, "modified-a");

    form.fieldArray.swap("items", 0, 1);

    const keysAfter = form.getState().arrayKeys["items"]!;
    expect(keysAfter[0]).toBe(keysBefore[1]);
    expect(keysAfter[1]).toBe(keysBefore[0]);

    // Dirty metadata still on the same stable key
    expect(form.getState().dirtyFields[`items.${keysBefore[0]}.name`]).toBe(true);
  });
});

describe("stable array keys - sort", () => {
  it("sorts array and preserves metadata association", () => {
    const form = makeForm([
      { name: "c", value: 3 },
      { name: "a", value: 1 },
      { name: "b", value: 2 },
    ]);
    const keysBefore = [...form.getState().arrayKeys["items"]!];

    // Mark "c" (index 0) as dirty
    form.field.setValue(`items.${keysBefore[0]}.name`, "C-modified");

    // Sort by value ascending: [a(1), b(2), c(3)]
    form.fieldArray.sort("items", (a, b) =>
      (a as { value: number }).value - (b as { value: number }).value,
    );

    const keysAfter = form.getState().arrayKeys["items"]!;
    // After sort: a was at index 1, b at index 2, c at index 0
    // Sorted by value: a(1), b(2), c(3) → permutation [1, 2, 0]
    expect(keysAfter[0]).toBe(keysBefore[1]); // "a" key
    expect(keysAfter[1]).toBe(keysBefore[2]); // "b" key
    expect(keysAfter[2]).toBe(keysBefore[0]); // "c" key

    // Dirty metadata still on "c"'s key
    expect(form.getState().dirtyFields[`items.${keysBefore[0]}.name`]).toBe(true);

    // Values are sorted
    expect(form.getValues().items.map((i) => i.value)).toEqual([1, 2, 3]);
    expect(form.getValues().items[2]!.name).toBe("C-modified");
  });

  it("sort with reorder method using explicit permutation", () => {
    const form = makeForm([
      { name: "a", value: 1 },
      { name: "b", value: 2 },
      { name: "c", value: 3 },
    ]);

    // Reverse the order
    form.fieldArray.reorder("items", [2, 1, 0]);

    expect(form.getValues().items.map((i) => i.name)).toEqual(["c", "b", "a"]);
  });
});

describe("stable array keys - insert", () => {
  it("inserts with a fresh key and preserves existing keys", () => {
    const form = makeForm([{ name: "a", value: 1 }, { name: "c", value: 3 }]);
    const keysBefore = [...form.getState().arrayKeys["items"]!];

    form.fieldArray.insert("items", 1, { name: "b", value: 2 });

    const keysAfter = form.getState().arrayKeys["items"]!;
    expect(keysAfter).toHaveLength(3);
    expect(keysAfter[0]).toBe(keysBefore[0]);
    expect(keysAfter[2]).toBe(keysBefore[1]);
    // New key at index 1
    expect(keysAfter[1]).not.toBe(keysBefore[0]);
    expect(keysAfter[1]).not.toBe(keysBefore[1]);
  });
});

describe("stable array keys - replace", () => {
  it("generates entirely new keys on replace", () => {
    const form = makeForm([{ name: "a", value: 1 }]);
    const keysBefore = [...form.getState().arrayKeys["items"]!];

    form.fieldArray.replace("items", [
      { name: "x", value: 10 },
      { name: "y", value: 20 },
    ]);

    const keysAfter = form.getState().arrayKeys["items"]!;
    expect(keysAfter).toHaveLength(2);
    expect(keysAfter[0]).not.toBe(keysBefore[0]);
  });
});

describe("stable array keys - reset", () => {
  it("rebuilds arrayKeys on form reset", () => {
    const form = makeForm([{ name: "a", value: 1 }]);
    const keysBefore = [...form.getState().arrayKeys["items"]!];

    form.fieldArray.append("items", { name: "b", value: 2 });
    form.reset();

    const keysAfter = form.getState().arrayKeys["items"]!;
    expect(keysAfter).toHaveLength(1);
    // Keys should be regenerated (not the same as before)
    expect(keysAfter[0]).not.toBe(keysBefore[0]);
  });
});

describe("stable array keys - field access with index paths", () => {
  it("getValue works with index-based paths", () => {
    const form = makeForm([{ name: "a", value: 1 }, { name: "b", value: 2 }]);
    expect(form.field.getValue("items.0.name" as any)).toBe("a");
    expect(form.field.getValue("items.1.name" as any)).toBe("b");
  });

  it("getValue works with key-based paths", () => {
    const form = makeForm([{ name: "a", value: 1 }, { name: "b", value: 2 }]);
    const keys = form.getState().arrayKeys["items"]!;
    expect(form.field.getValue(`items.${keys[0]}.name` as any)).toBe("a");
    expect(form.field.getValue(`items.${keys[1]}.name` as any)).toBe("b");
  });

  it("setValue with index path translates to key-based metadata", () => {
    const form = makeForm([{ name: "a", value: 1 }]);
    const key = form.getState().arrayKeys["items"]![0]!;

    form.field.setValue("items.0.name" as any, "modified");

    // Value should be updated
    expect(form.getValues().items[0]!.name).toBe("modified");

    // Dirty should be on key-based path
    expect(form.getState().dirtyFields[`items.${key}.name`]).toBe(true);
  });
});

describe("stable array keys - tree operations with index paths", () => {
  it("tree.isDirty with plain path matches key-based metadata", () => {
    const form = makeForm([{ name: "a", value: 1 }, { name: "b", value: 2 }]);
    const key = form.getState().arrayKeys["items"]![0]!;

    form.field.setValue(`items.${key}.name`, "modified");

    expect(form.tree.isDirty("items")).toBe(true);
    expect(form.tree.isDirty()).toBe(true);
  });

  it("tree.isDirty with index-based path resolves correctly", () => {
    const form = makeForm([{ name: "a", value: 1 }, { name: "b", value: 2 }]);

    form.field.setValue("items.0.name" as any, "modified");

    // "items.0" should resolve to "items._k0" and match dirtyFields["items._k0.name"]
    expect(form.tree.isDirty("items.0" as any)).toBe(true);
    expect(form.tree.isDirty("items.1" as any)).toBe(false);
  });

  it("tree.isValid with index-based path resolves correctly", () => {
    const form = makeForm([{ name: "a", value: 1 }]);
    const key = form.getState().arrayKeys["items"]![0]!;

    // Manually set an error with key-based path (simulating validation)
    form.field.setError(`items.${key}.name`, "required");

    expect(form.tree.isValid("items.0" as any)).toBe(false);
    expect(form.tree.isValid("items")).toBe(false);
    expect(form.tree.isValid()).toBe(false);
  });

  it("tree.getErrors with index-based path resolves correctly", () => {
    const form = makeForm([{ name: "a", value: 1 }, { name: "b", value: 2 }]);
    const keys = form.getState().arrayKeys["items"]!;

    form.field.setError(`items.${keys[0]}.name`, "err-a");
    form.field.setError(`items.${keys[1]}.name`, "err-b");

    const errorsAll = form.tree.getErrors("items");
    expect(Object.keys(errorsAll)).toHaveLength(2);

    const errorsFirst = form.tree.getErrors("items.0" as any);
    expect(Object.keys(errorsFirst)).toHaveLength(1);
    expect(errorsFirst[`items.${keys[0]}.name`]).toBe("err-a");
  });

  it("tree selectors work with index-based paths", () => {
    const form = makeForm([{ name: "a", value: 1 }, { name: "b", value: 2 }]);

    form.field.setValue("items.0.name" as any, "modified");

    const dirtySelector = form.tree.select.dirty("items.0" as any);
    expect(form.getState()).toSatisfy((s: any) => dirtySelector(s) === true);

    const dirtySelector1 = form.tree.select.dirty("items.1" as any);
    expect(form.getState()).toSatisfy((s: any) => dirtySelector1(s) === false);
  });
});

describe("stable array keys - getKeys API", () => {
  it("returns current keys for an array path", () => {
    const form = makeForm([{ name: "a", value: 1 }, { name: "b", value: 2 }]);
    const keys = form.fieldArray.getKeys("items");
    expect(keys).toEqual(form.getState().arrayKeys["items"]);
    expect(keys).toHaveLength(2);
  });

  it("returns empty array for unknown path", () => {
    const form = makeForm();
    expect(form.fieldArray.getKeys("nonexistent")).toEqual([]);
  });
});
