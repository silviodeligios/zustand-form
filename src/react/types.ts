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
export interface UseZFieldOptions<TError = string> {
  validate?: FieldValidatorEntry<TError>["validate"];
  validateMode?: FieldValidatorEntry<TError>["validateMode"];
  asyncValidate?: FieldValidatorEntry<TError>["asyncValidate"];
  asyncValidateMode?: FieldValidatorEntry<TError>["asyncValidateMode"];
  debounce?: FieldValidatorEntry<TError>["debounce"];
}

/** Return type of useZField */
export interface UseZFieldReturn<TError = string> {
  field: {
    value: unknown;
    onChange(value: unknown): void;
    onBlur(): void;
    onFocus(): void;
    ref: (el: HTMLElement | null) => void;
  };
  fieldState: FieldState<TError>;
}

/** Return type of useZFieldArray */
export interface UseZFieldArrayReturn {
  fields: FieldArrayItem[];
  append(value: unknown, options?: DispatchOptions): void;
  prepend(value: unknown, options?: DispatchOptions): void;
  remove(index: number, options?: DispatchOptions): void;
  insert(index: number, value: unknown, options?: DispatchOptions): void;
  move(from: number, to: number, options?: DispatchOptions): void;
  swap(indexA: number, indexB: number, options?: DispatchOptions): void;
  setValue(arr: unknown[], options?: DispatchOptions): void;
}
