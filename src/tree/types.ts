import type { FormState, DispatchOptions } from '../core/types'

export interface TreeSelectors<TValues> {
  dirty:         (s: FormState<TValues>) => boolean
  touched:       (s: FormState<TValues>) => boolean
  pending:       (s: FormState<TValues>) => boolean
  valid:         (s: FormState<TValues>) => boolean
  errors:        (s: FormState<TValues>) => Record<string, string>
  dirtyFields:   (s: FormState<TValues>) => string[]
  touchedFields: (s: FormState<TValues>) => string[]
  errorCount:    (s: FormState<TValues>) => number
}

export interface TreeApi<TValues> {
  isDirty(): boolean
  isTouched(): boolean
  isPending(): boolean
  isValid(): boolean
  getErrors(): Record<string, string>
  getDirtyFields(): string[]
  getTouchedFields(): string[]
  clearErrors(options?: DispatchOptions): void
  reset(options?: DispatchOptions): void
  validate(options?: DispatchOptions): void
  select: TreeSelectors<TValues>
}
