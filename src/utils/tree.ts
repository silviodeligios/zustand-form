/** Returns a matcher function for tree prefix matching */
export function treeMatcher(prefix?: string): (key: string) => boolean {
  if (!prefix) return () => true;
  return (key: string) => key === prefix || key.startsWith(prefix + ".");
}
