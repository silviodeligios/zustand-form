import type { StoreApi } from 'zustand/vanilla'
import type { FormState, Dispatch } from '../core/types'
import type { FieldNamespace, FieldState } from './types'
import * as A from '../core/actions'
import { getIn } from '../core/utils'

type Selector<R> = (s: FormState<unknown>) => R

function cached<R>(map: Map<string, Selector<R>>, path: string, factory: () => Selector<R>): Selector<R> {
  let sel = map.get(path)
  if (!sel) { sel = factory(); map.set(path, sel) }
  return sel
}

export function createFieldNamespace<TValues>(
  store: StoreApi<FormState<TValues>>,
  dispatch: Dispatch,
): FieldNamespace<TValues> {
  const s = () => store.getState()

  const cache = {
    value: new Map<string, Selector<unknown>>(),
    error: new Map<string, Selector<string | undefined>>(),
    dirty: new Map<string, Selector<boolean>>(),
    touched: new Map<string, Selector<boolean>>(),
    pending: new Map<string, Selector<boolean>>(),
    focused: new Map<string, Selector<boolean>>(),
    fieldState: new Map<string, Selector<FieldState>>(),
  }

  return {
    getValue:  (path) => getIn(s().values, path),
    isDirty:   (path) => s().dirtyFields[path] === true,
    isTouched: (path) => s().touchedFields[path] === true,
    isPending: (path) => s().pendingFields[path] === true,
    getError:  (path) => s().errors[path],

    setValue:      (path, v, opts?) => dispatch({ type: A.SET_VALUE, path, value: v, options: opts }),
    setError:     (path, msg, opts?) => dispatch({ type: A.SET_ERROR, path, value: msg, options: opts }),
    clearError:   (path, opts?) => dispatch({ type: A.CLEAR_ERROR, path, options: opts }),
    setTouched:   (path, v = true, opts?) => dispatch({ type: A.SET_TOUCHED, path, value: v, options: opts }),
    setDirty:     (path, v = true, opts?) => dispatch({ type: A.SET_DIRTY, path, value: v, options: opts }),
    focus:        (path, opts?) => dispatch({ type: A.FOCUS, path, options: opts }),
    blur:         (path, opts?) => dispatch({ type: A.BLUR, path, options: opts }),
    validate:     (path, opts?) => dispatch({ type: A.VALIDATE_FIELD, path, options: opts }),
    reset:        (path, opts?) => dispatch({ type: A.RESET_FIELD, path, options: opts }),
    pendingStart: (path, opts?) => dispatch({ type: A.PENDING_START, path, options: opts }),
    pendingEnd:   (path, opts?) => dispatch({ type: A.PENDING_END, path, options: opts }),

    select: {
      value:   (path) => cached(cache.value, path, () => (s) => getIn(s.values, path)) as (s: FormState<TValues>) => unknown,
      error:   (path) => cached(cache.error, path, () => (s) => s.errors[path]) as (s: FormState<TValues>) => string | undefined,
      dirty:   (path) => cached(cache.dirty, path, () => (s) => s.dirtyFields[path] ?? false) as (s: FormState<TValues>) => boolean,
      touched: (path) => cached(cache.touched, path, () => (s) => s.touchedFields[path] ?? false) as (s: FormState<TValues>) => boolean,
      pending: (path) => cached(cache.pending, path, () => (s) => s.pendingFields[path] ?? false) as (s: FormState<TValues>) => boolean,
      focused: (path) => cached(cache.focused, path, () => (s) => s.focusedField === path) as (s: FormState<TValues>) => boolean,
      fieldState: (path) => cached(cache.fieldState, path, () => (s) => ({
        value:   getIn(s.values, path),
        dirty:   s.dirtyFields[path] ?? false,
        touched: s.touchedFields[path] ?? false,
        error:   s.errors[path],
        pending: s.pendingFields[path] ?? false,
        focused: s.focusedField === path,
      })) as (s: FormState<TValues>) => FieldState,
    },
  }
}
