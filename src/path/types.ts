import type { FormState, DispatchOptions } from '../core/types'

export interface FieldState {
  value: unknown
  dirty: boolean
  touched: boolean
  error: string | undefined
  pending: boolean
}

export interface FieldSelectors<TValues> {
  value:      (s: FormState<TValues>) => unknown
  error:      (s: FormState<TValues>) => string | undefined
  dirty:      (s: FormState<TValues>) => boolean
  touched:    (s: FormState<TValues>) => boolean
  pending:    (s: FormState<TValues>) => boolean
  fieldState: (s: FormState<TValues>) => FieldState
}

export interface FieldApi<TValues> {
  getValue(): unknown
  isDirty(): boolean
  isTouched(): boolean
  isPending(): boolean
  getError(): string | undefined
  setValue(value: unknown, options?: DispatchOptions): void
  setError(msg: string, options?: DispatchOptions): void
  clearError(options?: DispatchOptions): void
  setTouched(value?: boolean, options?: DispatchOptions): void
  setDirty(value?: boolean, options?: DispatchOptions): void
  focus(options?: DispatchOptions): void
  blur(options?: DispatchOptions): void
  validate(options?: DispatchOptions): void
  reset(options?: DispatchOptions): void
  pendingStart(options?: DispatchOptions): void
  pendingEnd(options?: DispatchOptions): void
  append(value: unknown, options?: DispatchOptions): void
  remove(index: number, options?: DispatchOptions): void
  insert(index: number, value: unknown, options?: DispatchOptions): void
  move(from: number, to: number, options?: DispatchOptions): void
  select: FieldSelectors<TValues>
}
