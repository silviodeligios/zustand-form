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
