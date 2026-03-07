import type { StoreApi } from 'zustand/vanilla'
import type { FormState, Dispatch } from '../core/types'
import type { FieldArrayApi } from './types'
import * as A from '../core/actions'
import { getIn } from '../core/utils'

export function createFieldArrayApi<TValues>(
  store: StoreApi<FormState<TValues>>,
  dispatch: Dispatch,
  path: string,
): FieldArrayApi<TValues> {
  const s = () => store.getState()

  return {
    getLength: () => ((getIn(s().values, path) as unknown[]) ?? []).length,
    setValue:   (v, opts?) => dispatch({ type: A.SET_VALUE, path, value: v, options: opts }),

    append:  (v, opts?) => dispatch({ type: A.ARRAY_APPEND, path, value: v, options: opts }),
    prepend: (v, opts?) => dispatch({ type: A.ARRAY_INSERT, path, index: 0, value: v, options: opts }),
    remove:  (i, opts?) => dispatch({ type: A.ARRAY_REMOVE, path, index: i, options: opts }),
    insert:  (i, v, opts?) => dispatch({ type: A.ARRAY_INSERT, path, index: i, value: v, options: opts }),
    move:    (f, t, opts?) => dispatch({ type: A.ARRAY_MOVE, path, from: f, to: t, options: opts }),
    swap:    (a, b, opts?) => dispatch({ type: A.ARRAY_SWAP, path, from: a, to: b, options: opts }),

    select: {
      length: (s) => ((getIn(s.values, path) as unknown[]) ?? []).length,
    },
  }
}
