export type ArrayReindexOp =
  | { type: "remove"; index: number }
  | { type: "insert"; index: number }
  | { type: "move"; from: number; to: number }
  | { type: "swap"; from: number; to: number };

/** Returns the new index for a given index after an array op, or null if removed. */
export function computeNewIndex(
  index: number,
  op: ArrayReindexOp,
): number | null {
  if (op.type === "remove") {
    if (index === op.index) return null;
    return index > op.index ? index - 1 : index;
  }
  if (op.type === "insert") {
    return index >= op.index ? index + 1 : index;
  }
  if (op.type === "move") {
    const { from, to } = op;
    if (from === to) return index;
    if (index === from) return to;
    if (from < to) return index > from && index <= to ? index - 1 : index;
    return index >= to && index < from ? index + 1 : index;
  }
  // swap
  const { from, to } = op;
  if (from === to) return index;
  if (index === from) return to;
  if (index === to) return from;
  return index;
}

export function parsePathIndex(
  key: string,
  prefix: string,
): { index: number; suffix: string } | null {
  if (!key.startsWith(prefix)) return null;
  const rest = key.slice(prefix.length);
  const firstDot = rest.indexOf(".");
  const indexStr = firstDot === -1 ? rest : rest.slice(0, firstDot);
  const index = Number(indexStr);
  if (Number.isNaN(index) || index < 0) return null;
  const suffix = firstDot === -1 ? "" : rest.slice(firstDot);
  return { index, suffix };
}

export function reindexPathKeyedRecord<T>(
  record: Record<string, T>,
  arrayPath: string,
  op: ArrayReindexOp,
): Record<string, T> {
  const prefix = arrayPath + ".";
  const result: Record<string, T> = {};

  for (const key of Object.keys(record)) {
    if (key === arrayPath || !key.startsWith(prefix)) {
      result[key] = record[key]!;
      continue;
    }
    const parsed = parsePathIndex(key, prefix);
    if (!parsed) {
      result[key] = record[key]!;
      continue;
    }
    const newIndex = computeNewIndex(parsed.index, op);
    if (newIndex !== null) {
      result[prefix + String(newIndex) + parsed.suffix] = record[key]!;
    }
  }

  return result;
}

/**
 * Reindex a Map<string, V> in-place for array operations.
 * Keys matching `arrayPath.N...` are remapped. Removed entries trigger onRemove callback.
 */
export function reindexMap<V>(
  map: Map<string, V>,
  arrayPath: string,
  op: ArrayReindexOp,
  onRemove?: (key: string, value: V) => void,
  onMove?: (oldKey: string, newKey: string) => void,
): void {
  const prefix = arrayPath + ".";
  const toDelete: string[] = [];
  const toSet: [string, V][] = [];

  for (const [key, value] of map) {
    if (key === arrayPath || !key.startsWith(prefix)) continue;
    const parsed = parsePathIndex(key, prefix);
    if (!parsed) continue;

    const newIndex = computeNewIndex(parsed.index, op);
    toDelete.push(key);
    if (newIndex === null) {
      onRemove?.(key, value);
    } else {
      const newKey = prefix + String(newIndex) + parsed.suffix;
      toSet.push([newKey, value]);
      if (onMove && newKey !== key) onMove(key, newKey);
    }
  }

  for (const key of toDelete) map.delete(key);
  for (const [key, value] of toSet) map.set(key, value);
}
