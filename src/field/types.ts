import type { FormState, DispatchOptions } from "../core/types";

export interface FieldState<TError = string> {
  value: unknown;
  dirty: boolean;
  touched: boolean;
  error: TError | undefined;
  pending: boolean;
  focused: boolean;
}

type Selector<TValues, TError, R> = (s: FormState<TValues, TError>) => R;

export interface FieldNamespace<TValues, TError = string> {
  getValue(path: string): unknown;
  isDirty(path: string): boolean;
  isTouched(path: string): boolean;
  isPending(path: string): boolean;
  getError(path: string): TError | undefined;
  setValue(path: string, value: unknown, options?: DispatchOptions): void;
  setError(path: string, error: TError, options?: DispatchOptions): void;
  clearError(path: string, options?: DispatchOptions): void;
  setTouched(path: string, value?: boolean, options?: DispatchOptions): void;
  setDirty(path: string, value?: boolean, options?: DispatchOptions): void;
  focus(path: string, options?: DispatchOptions): void;
  blur(path: string, options?: DispatchOptions): void;
  validate(path: string, options?: DispatchOptions): void;
  reset(path: string, options?: DispatchOptions): void;
  pendingStart(path: string, options?: DispatchOptions): void;
  pendingEnd(path: string, options?: DispatchOptions): void;
  select: {
    value(path: string): Selector<TValues, TError, unknown>;
    error(path: string): Selector<TValues, TError, TError | undefined>;
    dirty(path: string): Selector<TValues, TError, boolean>;
    touched(path: string): Selector<TValues, TError, boolean>;
    pending(path: string): Selector<TValues, TError, boolean>;
    focused(path: string): Selector<TValues, TError, boolean>;
    fieldState(path: string): Selector<TValues, TError, FieldState<TError>>;
  };
}
