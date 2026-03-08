// Utility helpers for form internals

/** Deep get a value from an object using dot-notation path */
export function getIn(obj: unknown, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Deep get a value expected to be an array (returns [] if missing or not array) */
export function getInArray(obj: unknown, path: string): unknown[] {
  const val = getIn(obj, path);
  return Array.isArray(val) ? val : [];
}

/** Filter a Record keeping only keys matching a prefix (key === prefix || key starts with prefix.) */
export function filterByPrefix<V>(
  record: Record<string, V>,
  prefix?: string,
): Record<string, V> {
  if (!prefix) return { ...record };
  const result: Record<string, V> = {};
  for (const key of Object.keys(record)) {
    if (key === prefix || key.startsWith(prefix + ".")) {
      const val = record[key];
      if (val !== undefined) result[key] = val;
    }
  }
  return result;
}

/** Returns a matcher function for tree prefix matching */
export function treeMatcher(prefix?: string): (key: string) => boolean {
  if (!prefix) return () => true;
  return (key: string) => key === prefix || key.startsWith(prefix + ".");
}

/** Immutable deep set with structural sharing */
export function setIn<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split(".");
  if (keys.length === 0) return value as T;
  return setAtKeys(obj, keys, 0, value) as T;
}

function setAtKeys(
  obj: unknown,
  keys: string[],
  i: number,
  value: unknown,
): unknown {
  if (i === keys.length) return value;
  const key = keys[i]!;
  const current =
    obj != null ? (obj as Record<string, unknown>)[key] : undefined;
  const next = setAtKeys(current, keys, i + 1, value);
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[Number(key)] = next;
    return copy;
  }
  return { ...(obj as Record<string, unknown>), [key]: next };
}

/** Type guard for thenable values (Promise-like) */
export function isThenable(value: unknown): value is PromiseLike<void> {
  return (
    value != null && typeof (value as PromiseLike<void>).then === "function"
  );
}

/** Simple deep equality (handles primitives, plain objects, arrays) */
export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!isEqual(objA[key], objB[key])) return false;
  }
  return true;
}
