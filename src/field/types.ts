import type { FormState, DispatchOptions } from '../core/types'

export interface FieldState {
  value: unknown
  dirty: boolean
  touched: boolean
  error: string | undefined
  pending: boolean
  focused: boolean
}

type Selector<TValues, R> = (s: FormState<TValues>) => R

export interface FieldNamespace<TValues> {
  getValue(path: string): unknown
  isDirty(path: string): boolean
  isTouched(path: string): boolean
  isPending(path: string): boolean
  getError(path: string): string | undefined
  setValue(path: string, value: unknown, options?: DispatchOptions): void
  setError(path: string, msg: string, options?: DispatchOptions): void
  clearError(path: string, options?: DispatchOptions): void
  setTouched(path: string, value?: boolean, options?: DispatchOptions): void
  setDirty(path: string, value?: boolean, options?: DispatchOptions): void
  focus(path: string, options?: DispatchOptions): void
  blur(path: string, options?: DispatchOptions): void
  validate(path: string, options?: DispatchOptions): void
  reset(path: string, options?: DispatchOptions): void
  pendingStart(path: string, options?: DispatchOptions): void
  pendingEnd(path: string, options?: DispatchOptions): void
  select: {
    value(path: string): Selector<TValues, unknown>
    error(path: string): Selector<TValues, string | undefined>
    dirty(path: string): Selector<TValues, boolean>
    touched(path: string): Selector<TValues, boolean>
    pending(path: string): Selector<TValues, boolean>
    focused(path: string): Selector<TValues, boolean>
    fieldState(path: string): Selector<TValues, FieldState>
  }
}
