import type { StoreApi } from 'zustand/vanilla'
import type { FormState, Dispatch } from '../core/types'
import type { TreeApi } from './types'
import * as A from '../core/actions'
import { treeMatcher } from '../core/utils'

export function createTreeApi<TValues>(
  store: StoreApi<FormState<TValues>>,
  dispatch: Dispatch,
  prefix?: string,
): TreeApi<TValues> {
  const s = () => store.getState()
  const match = treeMatcher(prefix)

  const filterErrors = (state: FormState<TValues>): Record<string, string> => {
    const result: Record<string, string> = {}
    for (const k of Object.keys(state.errors)) {
      const v = state.errors[k]
      if (match(k) && v !== undefined) result[k] = v
    }
    return result
  }

  return {
    // Getter imperativi
    isDirty:          () => Object.keys(s().dirtyFields).some(match),
    isTouched:        () => Object.keys(s().touchedFields).some(match),
    isPending:        () => Object.keys(s().pendingFields).some(match),
    isValid:          () => !Object.keys(s().errors).some(k => match(k) && s().errors[k] !== undefined),
    getErrors:        () => filterErrors(s()),
    getDirtyFields:   () => Object.keys(s().dirtyFields).filter(match),
    getTouchedFields: () => Object.keys(s().touchedFields).filter(match),

    // Setter (stub dispatch)
    clearErrors: (opts?) => dispatch({ type: A.CLEAR_ERRORS_BRANCH, path: prefix, options: opts }),
    reset:       (opts?) => dispatch({ type: A.RESET_BRANCH, path: prefix, options: opts }),
    validate:    (opts?) => dispatch({ type: A.VALIDATE_BRANCH, path: prefix, options: opts }),

    // Selector pre-costruiti
    select: {
      dirty:         (s) => Object.keys(s.dirtyFields).some(match),
      touched:       (s) => Object.keys(s.touchedFields).some(match),
      pending:       (s) => Object.keys(s.pendingFields).some(match),
      valid:         (s) => !Object.keys(s.errors).some(k => match(k) && s.errors[k] !== undefined),
      errors:        (s) => filterErrors(s),
      dirtyFields:   (s) => Object.keys(s.dirtyFields).filter(match),
      touchedFields: (s) => Object.keys(s.touchedFields).filter(match),
      errorCount:    (s) => Object.keys(s.errors).filter(k => match(k) && s.errors[k] !== undefined).length,
    },
  }
}
