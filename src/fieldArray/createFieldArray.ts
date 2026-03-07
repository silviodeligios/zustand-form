import type { StoreApi } from 'zustand/vanilla'
import type { FormState, Dispatch } from '../core/types'
import type { FieldArrayNamespace } from './types'
import * as A from '../core/actions'
import { getIn } from '../core/utils'

type Selector<R> = (s: FormState<unknown>) => R

function cached<R>(map: Map<string, Selector<R>>, path: string, factory: () => Selector<R>): Selector<R> {
  let sel = map.get(path)
  if (!sel) { sel = factory(); map.set(path, sel) }
  return sel
}

export function createFieldArrayNamespace<TValues>(
  store: StoreApi<FormState<TValues>>,
  dispatch: Dispatch,
): FieldArrayNamespace<TValues> {
  const s = () => store.getState()

  const lengthCache = new Map<string, Selector<number>>()

  return {
    getLength: (path) => ((getIn(s().values, path) as unknown[]) ?? []).length,
    setValue:   (path, v, opts?) => dispatch({ type: A.SET_VALUE, path, value: v, options: opts }),

    append:  (path, v, opts?) => dispatch({ type: A.ARRAY_APPEND, path, value: v, options: opts }),
    prepend: (path, v, opts?) => dispatch({ type: A.ARRAY_INSERT, path, index: 0, value: v, options: opts }),
    remove:  (path, i, opts?) => dispatch({ type: A.ARRAY_REMOVE, path, index: i, options: opts }),
    insert:  (path, i, v, opts?) => dispatch({ type: A.ARRAY_INSERT, path, index: i, value: v, options: opts }),
    move:    (path, f, t, opts?) => dispatch({ type: A.ARRAY_MOVE, path, from: f, to: t, options: opts }),
    swap:    (path, a, b, opts?) => dispatch({ type: A.ARRAY_SWAP, path, from: a, to: b, options: opts }),

    select: {
      length: (path) => cached(lengthCache, path, () => (s) => ((getIn(s.values, path) as unknown[]) ?? []).length) as (s: FormState<TValues>) => number,
    },
  }
}
