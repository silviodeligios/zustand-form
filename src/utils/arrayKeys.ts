import { getIn } from "./paths";

/** Check if a path segment is a stable array key (e.g., "_k0", "_k42") */
export function isArrayKey(segment: string): boolean {
  return segment.length > 2 && segment.charCodeAt(0) === 95 /* _ */ &&
    segment.charCodeAt(1) === 107 /* k */ &&
    /^\d+$/.test(segment.slice(2));
}

/**
 * Translate an index-based path to a key-based path for metadata lookups.
 * Numeric segments that correspond to known arrays in arrayKeys are replaced
 * with stable keys. Already key-based segments pass through unchanged.
 *
 * Example: "items.0.name" → "items._k0.name"
 */
export function indexPathToKeyPath(
  path: string,
  arrayKeys: Record<string, string[]>,
): string {
  const segments = path.split(".");
  const result: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;

    if (isArrayKey(seg)) {
      result.push(seg);
    } else if (/^\d+$/.test(seg)) {
      const parentPath = result.join(".");
      const keys = arrayKeys[parentPath];
      if (keys) {
        const index = Number(seg);
        if (index >= 0 && index < keys.length) {
          result.push(keys[index]!);
        } else {
          result.push(seg);
        }
      } else {
        result.push(seg);
      }
    } else {
      result.push(seg);
    }
  }

  return result.join(".");
}

/**
 * Translate a key-based path to an index-based path for value access.
 * Stable key segments are replaced with their numeric index in the ordered
 * arrayKeys array.
 *
 * Example: "items._k0.name" → "items.0.name"
 */
export function keyPathToIndexPath(
  path: string,
  arrayKeys: Record<string, string[]>,
): string {
  const segments = path.split(".");
  const result: string[] = [];
  const keyResult: string[] = [];

  for (const seg of segments) {
    if (isArrayKey(seg)) {
      const parentKeyPath = keyResult.join(".");
      const keys = arrayKeys[parentKeyPath];
      if (keys) {
        const idx = keys.indexOf(seg);
        result.push(idx >= 0 ? String(idx) : seg);
      } else {
        result.push(seg);
      }
      keyResult.push(seg);
    } else {
      result.push(seg);
      keyResult.push(seg);
    }
  }

  return result.join(".");
}

/**
 * Walk a value tree and build an arrayKeys map for all arrays found.
 * Values are NOT modified — this only generates the key mapping.
 * Key paths in arrayKeys use stable `_k` segments for array elements.
 */
export function scanArrayKeys(
  value: unknown,
  parentKeyPath: string,
  startCounter: number,
): { arrayKeys: Record<string, string[]>; nextCounter: number } {
  const arrayKeys: Record<string, string[]> = {};
  let counter = startCounter;

  function scan(val: unknown, keyPath: string): void {
    if (Array.isArray(val)) {
      const keys: string[] = [];
      for (let i = 0; i < val.length; i++) {
        const key = "_k" + counter++;
        keys.push(key);
        scan(val[i], keyPath ? keyPath + "." + key : key);
      }
      arrayKeys[keyPath] = keys;
    } else if (val != null && typeof val === "object") {
      for (const [prop, child] of Object.entries(val)) {
        scan(child, keyPath ? keyPath + "." + prop : prop);
      }
    }
  }

  scan(value, parentKeyPath);
  return { arrayKeys, nextCounter: counter };
}

/**
 * Generate a new key and return it along with the incremented counter.
 */
export function generateKey(counter: number): { key: string; nextCounter: number } {
  return { key: "_k" + counter, nextCounter: counter + 1 };
}

/**
 * Remove all entries from a Record whose key equals prefix or starts with prefix + ".".
 * Returns the same reference if nothing was removed (fast early exit).
 */
export function removeByPrefix<T>(
  record: Record<string, T>,
  keyPrefix: string,
): Record<string, T> {
  const dotPrefix = keyPrefix + ".";
  let hasMatch = false;
  for (const k of Object.keys(record)) {
    if (k === keyPrefix || k.startsWith(dotPrefix)) {
      hasMatch = true;
      break;
    }
  }
  if (!hasMatch) return record;

  const next: Record<string, T> = {};
  for (const k of Object.keys(record)) {
    if (k !== keyPrefix && !k.startsWith(dotPrefix)) {
      next[k] = record[k]!;
    }
  }
  return next;
}

/** @deprecated Use `removeByPrefix` instead */
export const removeKeyedEntries = removeByPrefix;
/** @deprecated Use `removeByPrefix` instead */
export const removeNestedArrayKeys = removeByPrefix;

/**
 * Convert a flat record of key-based paths to a nested structure matching the
 * values shape.  Array key segments (_kN) are translated back to numeric
 * indices so the result contains real arrays.
 *
 * `keyPrefix` (already key-based) is stripped from every entry before building
 * the tree.  When omitted the full path is used.
 */
export function unflattenToNested<T>(
  flatEntries: Iterable<readonly [string, T]>,
  arrayKeys: Record<string, string[]>,
  keyPrefix?: string,
): unknown {
  const prefixIndex = keyPrefix
    ? keyPathToIndexPath(keyPrefix, arrayKeys)
    : undefined;
  const stripLen = prefixIndex ? prefixIndex.length + 1 : 0;

  // First pass: collect relative index-based paths
  const entries: [string, T][] = [];
  for (const [keyPath, value] of flatEntries) {
    const fullIndex = keyPathToIndexPath(keyPath, arrayKeys);
    const rel = stripLen > 0 ? fullIndex.slice(stripLen) : fullIndex;
    if (!rel) continue; // exact prefix match — skip (leaf on the prefix itself)
    entries.push([rel, value]);
  }

  if (entries.length === 0) return {};

  // Determine if root container should be an array
  const firstSeg = entries[0]![0].split(".")[0]!;
  const root: any = /^\d+$/.test(firstSeg) ? [] : {};

  for (const [path, value] of entries) {
    const segments = path.split(".");
    let current: any = root;

    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]!;
      const key: string | number = /^\d+$/.test(seg) ? Number(seg) : seg;
      if (current[key] == null) {
        const nextSeg = segments[i + 1]!;
        current[key] = /^\d+$/.test(nextSeg) ? [] : {};
      }
      current = current[key];
    }

    const last = segments[segments.length - 1]!;
    current[/^\d+$/.test(last) ? Number(last) : last] = value;
  }

  return root;
}

/**
 * Get a value at a key-based path by translating to index-based first.
 * Shorthand for `getIn(values, keyPathToIndexPath(keyPath, arrayKeys))`.
 */
export function getValueAtKeyPath(
  values: unknown,
  keyPath: string,
  arrayKeys: Record<string, string[]>,
): unknown {
  return getIn(values, keyPathToIndexPath(keyPath, arrayKeys));
}
