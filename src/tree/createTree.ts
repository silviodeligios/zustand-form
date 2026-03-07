import type { StoreApi } from 'zustand/vanilla'
import type { FormState, Dispatch } from '../core/types'
import type { TreeNamespace } from './types'
import * as A from '../core/actions'
import { treeMatcher } from '../core/utils'
import { createTreeSelectors } from './selectors'

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

    select: createTreeSelectors<TValues>(getMatcher, filterErrors),
  }
}
