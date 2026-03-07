import { useMemo, useCallback, useRef, useState } from 'react'
import type { FormHook, UseZFieldArrayReturn } from './types'
import type { DispatchOptions } from '../core/types'

let keyCounter = 0
function generateKey(): string {
  return '_k' + keyCounter++
}

export function useZFieldArray<TValues>(
  form: FormHook<TValues>,
  path: string,
): UseZFieldArrayReturn {
  const api = useMemo(() => form.fieldArray(path), [form, path])
  const length = form(api.select.length)
  const [version, setVersion] = useState(0)
  const keysRef = useRef<string[]>([])

  // Reconcile keys when length changes externally
  if (keysRef.current.length !== length) {
    const prev = keysRef.current
    if (length > prev.length) {
      keysRef.current = [...prev, ...Array.from({ length: length - prev.length }, generateKey)]
    } else {
      keysRef.current = prev.slice(0, length)
    }
  }

  const bump = useCallback(() => setVersion(v => v + 1), [])

  const append = useCallback((value: unknown, opts?: DispatchOptions) => {
    keysRef.current = [...keysRef.current, generateKey()]
    api.append(value, opts)
    bump()
  }, [api, bump])

  const prepend = useCallback((value: unknown, opts?: DispatchOptions) => {
    keysRef.current = [generateKey(), ...keysRef.current]
    api.prepend(value, opts)
    bump()
  }, [api, bump])

  const remove = useCallback((index: number, opts?: DispatchOptions) => {
    keysRef.current = keysRef.current.filter((_, i) => i !== index)
    api.remove(index, opts)
    bump()
  }, [api, bump])

  const insert = useCallback((index: number, value: unknown, opts?: DispatchOptions) => {
    const next = [...keysRef.current]
    next.splice(index, 0, generateKey())
    keysRef.current = next
    api.insert(index, value, opts)
    bump()
  }, [api, bump])

  const move = useCallback((from: number, to: number, opts?: DispatchOptions) => {
    const next = [...keysRef.current]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    keysRef.current = next
    api.move(from, to, opts)
    bump()
  }, [api, bump])

  const swap = useCallback((indexA: number, indexB: number, opts?: DispatchOptions) => {
    const next = [...keysRef.current]
    const tmp = next[indexA]
    next[indexA] = next[indexB]
    next[indexB] = tmp
    keysRef.current = next
    api.swap(indexA, indexB, opts)
    bump()
  }, [api, bump])

  const setValue = useCallback((arr: unknown[], opts?: DispatchOptions) => {
    keysRef.current = arr.map(() => generateKey())
    api.setValue(arr, opts)
    bump()
  }, [api, bump])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fields = useMemo(
    () => keysRef.current.map((id, index) => ({ id, index })),
    [version, length],
  )

  return { fields, append, prepend, remove, insert, move, swap, setValue }
}
