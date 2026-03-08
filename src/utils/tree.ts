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
