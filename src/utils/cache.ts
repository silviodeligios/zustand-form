/** Memoize a factory result by key in a Map */
export function cached<R>(
  map: Map<string, R>,
  key: string,
  factory: () => R,
): R {
  let entry = map.get(key);
  if (!entry) {
    entry = factory();
    map.set(key, entry);
  }
  return entry;
}
