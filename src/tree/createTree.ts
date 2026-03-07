import type { StoreApi } from 'zustand/vanilla'
import type { FormState, Dispatch } from '../core/types'
import type { TreeNamespace } from './types'
import * as A from '../core/actions'
import { treeMatcher } from '../core/utils'

type Selector<R> = (s: FormState<unknown>) => R

function cached<R>(map: Map<string, Selector<R>>, key: string, factory: () => Selector<R>): Selector<R> {
  let sel = map.get(key)
  if (!sel) { sel = factory(); map.set(key, sel) }
  return sel
}

export function createTreeNamespace<TValues>(
  store: StoreApi<FormState<TValues>>,
  dispatch: Dispatch,
): TreeNamespace<TValues> {
  const s = () => store.getState()
  const matcherCache = new Map<string, (key: string) => boolean>()

  function getMatcher(path?: string): (key: string) => boolean {
    const key = path ?? ''
    let m = matcherCache.get(key)
    if (!m) { m = treeMatcher(path); matcherCache.set(key, m) }
    return m
  }

  function filterErrors(state: FormState<TValues>, match: (k: string) => boolean): Record<string, string> {
    const result: Record<string, string> = {}
    for (const k of Object.keys(state.errors)) {
      const v = state.errors[k]
      if (match(k) && v !== undefined) result[k] = v
    }
    return result
  }

  const cache = {
    dirty: new Map<string, Selector<boolean>>(),
    touched: new Map<string, Selector<boolean>>(),
    pending: new Map<string, Selector<boolean>>(),
    valid: new Map<string, Selector<boolean>>(),
    errors: new Map<string, Selector<Record<string, string>>>(),
    dirtyFields: new Map<string, Selector<string[]>>(),
    touchedFields: new Map<string, Selector<string[]>>(),
    errorCount: new Map<string, Selector<number>>(),
  }

  const cacheKey = (path?: string) => path ?? ''

  return {
    isDirty:          (path?) => Object.keys(s().dirtyFields).some(getMatcher(path)),
    isTouched:        (path?) => Object.keys(s().touchedFields).some(getMatcher(path)),
    isPending:        (path?) => Object.keys(s().pendingFields).some(getMatcher(path)),
    isValid:          (path?) => !Object.keys(s().errors).some(k => getMatcher(path)(k) && s().errors[k] !== undefined),
    getErrors:        (path?) => filterErrors(s(), getMatcher(path)),
    getDirtyFields:   (path?) => Object.keys(s().dirtyFields).filter(getMatcher(path)),
    getTouchedFields: (path?) => Object.keys(s().touchedFields).filter(getMatcher(path)),

    clearErrors: (path?, opts?) => dispatch({ type: A.CLEAR_ERRORS_BRANCH, path, options: opts }),
    reset:       (path?, opts?) => dispatch({ type: A.RESET_BRANCH, path, options: opts }),
    validate:    (path?, opts?) => dispatch({ type: A.VALIDATE_BRANCH, path, options: opts }),

    select: {
      dirty:   (path?) => {
        const k = cacheKey(path); const match = getMatcher(path)
        return cached(cache.dirty, k, () => (s) => Object.keys(s.dirtyFields).some(match)) as (s: FormState<TValues>) => boolean
      },
      touched: (path?) => {
        const k = cacheKey(path); const match = getMatcher(path)
        return cached(cache.touched, k, () => (s) => Object.keys(s.touchedFields).some(match)) as (s: FormState<TValues>) => boolean
      },
      pending: (path?) => {
        const k = cacheKey(path); const match = getMatcher(path)
        return cached(cache.pending, k, () => (s) => Object.keys(s.pendingFields).some(match)) as (s: FormState<TValues>) => boolean
      },
      valid: (path?) => {
        const k = cacheKey(path); const match = getMatcher(path)
        return cached(cache.valid, k, () => (s) => !Object.keys(s.errors).some(key => match(key) && s.errors[key] !== undefined)) as (s: FormState<TValues>) => boolean
      },
      errors: (path?) => {
        const k = cacheKey(path); const match = getMatcher(path)
        return cached(cache.errors, k, () => (s) => filterErrors(s as FormState<TValues>, match)) as (s: FormState<TValues>) => Record<string, string>
      },
      dirtyFields: (path?) => {
        const k = cacheKey(path); const match = getMatcher(path)
        return cached(cache.dirtyFields, k, () => (s) => Object.keys(s.dirtyFields).filter(match)) as (s: FormState<TValues>) => string[]
      },
      touchedFields: (path?) => {
        const k = cacheKey(path); const match = getMatcher(path)
        return cached(cache.touchedFields, k, () => (s) => Object.keys(s.touchedFields).filter(match)) as (s: FormState<TValues>) => string[]
      },
      errorCount: (path?) => {
        const k = cacheKey(path); const match = getMatcher(path)
        return cached(cache.errorCount, k, () => (s) => Object.keys(s.errors).filter(key => match(key) && s.errors[key] !== undefined).length) as (s: FormState<TValues>) => number
      },
    },
  }
}
