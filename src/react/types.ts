import type { FormState, Form, DispatchOptions } from "../core/types";
import type { FieldValidatorEntry } from "../validation/types";
import type { FieldState } from "../field/types";
import type { FieldArrayItem } from "../fieldArray/types";

/** Form callable as React selector hook + vanilla Form methods */
export interface FormHook<TValues, TError = string> extends Form<
  TValues,
  TError
> {
  <U>(
    selector: (state: FormState<TValues, TError>) => U,
    equalityFn?: (a: U, b: U) => boolean,
  ): U;
}

/** Options for useZField — per-field validation + registration */
export interface UseZFieldOptions<TError = string, TValue = unknown> {
  validate?: FieldValidatorEntry<TError, TValue>["validate"];
  validateMode?: FieldValidatorEntry<TError>["validateMode"];
  asyncValidate?: FieldValidatorEntry<TError, TValue>["asyncValidate"];
  asyncValidateMode?: FieldValidatorEntry<TError>["asyncValidateMode"];
  debounce?: FieldValidatorEntry<TError>["debounce"];
}

/** Return type of useZField */
export interface UseZFieldReturn<TError = string, TValue = unknown> {
  field: {
    value: TValue;
    onChange(value: TValue): void;
    onBlur(): void;
    onFocus(): void;
    ref: (el: HTMLElement | null) => void;
  };
  fieldState: FieldState<TError, TValue>;
}

/** Field array state (subset of FieldState without value/focused) */
export interface FieldArrayState<TError = string> {
  dirty: boolean;
  touched: boolean;
  error: TError | undefined;
  pending: boolean;
}

/** Return type of useZFieldArray */
export interface UseZFieldArrayReturn<TError = string, TElement = unknown> {
  fields: FieldArrayItem[];
  fieldState: FieldArrayState<TError>;
  append(value: TElement, options?: DispatchOptions): void;
  prepend(value: TElement, options?: DispatchOptions): void;
  remove(index: number, options?: DispatchOptions): void;
  insert(index: number, value: TElement, options?: DispatchOptions): void;
  move(from: number, to: number, options?: DispatchOptions): void;
  swap(indexA: number, indexB: number, options?: DispatchOptions): void;
  setValue(arr: TElement[], options?: DispatchOptions): void;
}
