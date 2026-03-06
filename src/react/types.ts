import type { FormState, Form, DispatchOptions } from '../core/types'
import type { FieldValidatorEntry } from '../validation/types'
import type { FieldState } from '../path/types'

/** Form callable as React selector hook + vanilla Form methods */
export interface FormHook<TValues> extends Form<TValues> {
  <U>(selector: (state: FormState<TValues>) => U, equalityFn?: (a: U, b: U) => boolean): U
}

/** Options for useZField — per-field validation + registration */
export interface UseZFieldOptions {
  validate?: FieldValidatorEntry['validate']
  validateMode?: FieldValidatorEntry['validateMode']
  asyncValidate?: FieldValidatorEntry['asyncValidate']
  asyncValidateMode?: FieldValidatorEntry['asyncValidateMode']
  debounce?: FieldValidatorEntry['debounce']
}

/** Return type of useZField */
export interface UseZFieldReturn {
  field: {
    value: unknown
    onChange(value: unknown): void
    onBlur(): void
    onFocus(): void
    ref: (el: HTMLElement | null) => void
  }
  fieldState: FieldState
}

/** Return type of useZFieldArray */
export interface UseZFieldArrayReturn {
  fields: unknown[]
  append(value: unknown, options?: DispatchOptions): void
  remove(index: number, options?: DispatchOptions): void
  insert(index: number, value: unknown, options?: DispatchOptions): void
  move(from: number, to: number, options?: DispatchOptions): void
}
