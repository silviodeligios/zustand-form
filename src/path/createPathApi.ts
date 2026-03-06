import type { StoreApi } from 'zustand/vanilla'
import type { FormState, Dispatch } from '../core/types'
import type { FieldApi } from './types'
import * as A from '../core/actions'
import { getIn } from '../core/utils'

export function createFieldApi<TValues>(
  store: StoreApi<FormState<TValues>>,
  dispatch: Dispatch,
  path: string,
): FieldApi<TValues> {
  const s = () => store.getState()

  return {
    // Getter imperativi
    getValue:  () => getIn(s().values, path),
    isDirty:   () => s().dirtyFields[path] === true,
    isTouched: () => s().touchedFields[path] === true,
    isPending: () => s().pendingFields[path] === true,
    getError:  () => s().errors[path],

    // Setter (stub dispatch)
    setValue:      (v, opts?) => dispatch({ type: A.SET_VALUE, path, value: v, options: opts }),
    setError:     (msg, opts?) => dispatch({ type: A.SET_ERROR, path, value: msg, options: opts }),
    clearError:   (opts?) => dispatch({ type: A.CLEAR_ERROR, path, options: opts }),
    setTouched:   (v = true, opts?) => dispatch({ type: A.SET_TOUCHED, path, value: v, options: opts }),
    setDirty:     (v = true, opts?) => dispatch({ type: A.SET_DIRTY, path, value: v, options: opts }),
    focus:        (opts?) => dispatch({ type: A.FOCUS, path, options: opts }),
    blur:         (opts?) => dispatch({ type: A.BLUR, path, options: opts }),
    validate:     (opts?) => dispatch({ type: A.VALIDATE_FIELD, path, options: opts }),
    reset:        (opts?) => dispatch({ type: A.RESET_FIELD, path, options: opts }),
    pendingStart: (opts?) => dispatch({ type: A.PENDING_START, path, options: opts }),
    pendingEnd:   (opts?) => dispatch({ type: A.PENDING_END, path, options: opts }),
    append:       (v, opts?) => dispatch({ type: A.ARRAY_APPEND, path, value: v, options: opts }),
    remove:       (i, opts?) => dispatch({ type: A.ARRAY_REMOVE, path, index: i, options: opts }),
    insert:       (i, v, opts?) => dispatch({ type: A.ARRAY_INSERT, path, index: i, value: v, options: opts }),
    move:         (f, t, opts?) => dispatch({ type: A.ARRAY_MOVE, path, from: f, to: t, options: opts }),

    // Selector pre-costruiti
    select: {
      value:   (s) => getIn(s.values, path),
      error:   (s) => s.errors[path],
      dirty:   (s) => s.dirtyFields[path] ?? false,
      touched: (s) => s.touchedFields[path] ?? false,
      pending: (s) => s.pendingFields[path] ?? false,
      fieldState: (s) => ({
        value:   getIn(s.values, path),
        dirty:   s.dirtyFields[path] ?? false,
        touched: s.touchedFields[path] ?? false,
        error:   s.errors[path],
        pending: s.pendingFields[path] ?? false,
      }),
    },
  }
}
