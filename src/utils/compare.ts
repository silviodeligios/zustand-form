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
