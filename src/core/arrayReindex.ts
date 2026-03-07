export type ArrayReindexOp =
  | { type: 'remove'; index: number }
  | { type: 'insert'; index: number }
  | { type: 'move'; from: number; to: number }
  | { type: 'swap'; from: number; to: number }

export function reindexPathKeyedRecord<T>(
  record: Record<string, T>,
  arrayPath: string,
  op: ArrayReindexOp,
): Record<string, T> {
  const prefix = arrayPath + '.'
  const result: Record<string, T> = {}

  for (const key of Object.keys(record)) {
    if (key === arrayPath || !key.startsWith(prefix)) {
      result[key] = record[key]
      continue
    }
    const rest = key.slice(prefix.length)
    const firstDot = rest.indexOf('.')
    const indexStr = firstDot === -1 ? rest : rest.slice(0, firstDot)
    const index = Number(indexStr)
    if (Number.isNaN(index) || index < 0) {
      result[key] = record[key]
      continue
    }
    const suffix = firstDot === -1 ? '' : rest.slice(firstDot)

    let newIndex: number | null = null

    if (op.type === 'remove') {
      if (index === op.index) continue
      newIndex = index > op.index ? index - 1 : index
    } else if (op.type === 'insert') {
      newIndex = index >= op.index ? index + 1 : index
    } else if (op.type === 'move') {
      const { from, to } = op
      if (from === to) { result[key] = record[key]; continue }
      if (index === from) {
        newIndex = to
      } else if (from < to) {
        newIndex = (index > from && index <= to) ? index - 1 : index
      } else {
        newIndex = (index >= to && index < from) ? index + 1 : index
      }
    } else {
      // swap
      const { from, to } = op
      if (from === to) { result[key] = record[key]; continue }
      if (index === from) {
        newIndex = to
      } else if (index === to) {
        newIndex = from
      } else {
        newIndex = index
      }
    }

    if (newIndex !== null) {
      result[prefix + String(newIndex) + suffix] = record[key]
    }
  }

  return result
}
