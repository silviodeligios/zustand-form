import type { FormState } from '../core/types'
import type { FieldState } from './types'
import { getIn } from '../core/utils'

type Selector<R> = (s: FormState<unknown>) => R

function cached<R>(map: Map<string, Selector<R>>, path: string, factory: () => Selector<R>): Selector<R> {
  let sel = map.get(path)
  if (!sel) { sel = factory(); map.set(path, sel) }
  return sel
}

export function createFieldSelectors<TValues>() {
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
    value:   (path: string) => cached(cache.value, path, () => (s) => getIn(s.values, path)) as (s: FormState<TValues>) => unknown,
    error:   (path: string) => cached(cache.error, path, () => (s) => s.errors[path]) as (s: FormState<TValues>) => string | undefined,
    dirty:   (path: string) => cached(cache.dirty, path, () => (s) => s.dirtyFields[path] ?? false) as (s: FormState<TValues>) => boolean,
    touched: (path: string) => cached(cache.touched, path, () => (s) => s.touchedFields[path] ?? false) as (s: FormState<TValues>) => boolean,
    pending: (path: string) => cached(cache.pending, path, () => (s) => s.pendingFields[path] ?? false) as (s: FormState<TValues>) => boolean,
    focused: (path: string) => cached(cache.focused, path, () => (s) => s.focusedField === path) as (s: FormState<TValues>) => boolean,
    fieldState: (path: string) => cached(cache.fieldState, path, () => (s) => ({
      value:   getIn(s.values, path),
      dirty:   s.dirtyFields[path] ?? false,
      touched: s.touchedFields[path] ?? false,
      error:   s.errors[path],
      pending: s.pendingFields[path] ?? false,
      focused: s.focusedField === path,
    })) as (s: FormState<TValues>) => FieldState,
  }
}
