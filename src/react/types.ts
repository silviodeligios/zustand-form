import type { FormState, Form, DispatchOptions } from "../core/types";
import type { FieldValidatorEntry } from "../validation/types";
import type { FieldState, InputProps } from "../field/types";
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

/** Options for useField — per-field validation + registration */
export interface UseFieldOptions<TError = string, TValue = unknown> {
  validate?: FieldValidatorEntry<TError, TValue>["validate"];
  validateMode?: FieldValidatorEntry<TError>["validateMode"];
  asyncValidate?: FieldValidatorEntry<TError, TValue>["asyncValidate"];
  asyncValidateMode?: FieldValidatorEntry<TError>["asyncValidateMode"];
  debounce?: FieldValidatorEntry<TError>["debounce"];
}

/** Return type of useField */
export interface UseFieldReturn<TError = string, TValue = unknown> {
  field: InputProps<TValue> & {
    ref: (el: HTMLElement | null) => void;
  };
  fieldState: FieldState<TError>;
}

/** Return type of useFieldArray */
export interface UseFieldArrayReturn<TError = string, TElement = unknown> {
  fields: FieldArrayItem[];
  fieldState: FieldState<TError>;
  append(value: TElement, options?: DispatchOptions): void;
  prepend(value: TElement, options?: DispatchOptions): void;
  remove(index: number, options?: DispatchOptions): void;
  insert(index: number, value: TElement, options?: DispatchOptions): void;
  move(from: number, to: number, options?: DispatchOptions): void;
  swap(indexA: number, indexB: number, options?: DispatchOptions): void;
  replace(arr: TElement[], options?: DispatchOptions): void;
}
