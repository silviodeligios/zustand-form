import { useMemo } from 'react'
import type { FormHook, UseZFieldArrayReturn } from './types'
import { getIn } from '../core/utils'

export function useZFieldArray<TValues>(
  form: FormHook<TValues>,
  path: string,
): UseZFieldArrayReturn {
  const p = useMemo(() => form.field(path), [form, path])

  const fields = form(
    (s) => (getIn(s.values, path) as unknown[]) ?? [],
  )

  return {
    fields,
    append: p.append,
    remove: p.remove,
    insert: p.insert,
    move: p.move,
  }
}
