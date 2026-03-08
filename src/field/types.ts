import type { FormState, DispatchOptions } from "../core/types";
import type { Path, PathValue } from "../types/paths";

export interface FieldState<TError = string, TValue = unknown> {
  value: TValue;
  dirty: boolean;
  touched: boolean;
  error: TError | undefined;
  pending: boolean;
  focused: boolean;
}

type Selector<TValues, TError, R> = (s: FormState<TValues, TError>) => R;

/** Accepts Path<TValues> for autocomplete, or any string for dynamic paths */
type FieldPath<TValues> = Path<TValues> | (string & Record<never, never>);

export interface FieldNamespace<TValues, TError = string> {
  getValue<P extends Path<TValues>>(path: P): PathValue<TValues, P>;
  getValue(path: string): unknown;
  isDirty(path: FieldPath<TValues>): boolean;
  isTouched(path: FieldPath<TValues>): boolean;
  isPending(path: FieldPath<TValues>): boolean;
  getError(path: FieldPath<TValues>): TError | undefined;
  setValue<P extends Path<TValues>>(
    path: P,
    value: PathValue<TValues, P>,
    options?: DispatchOptions,
  ): void;
  setValue(path: string, value: unknown, options?: DispatchOptions): void;
  setError(
    path: FieldPath<TValues>,
    error: TError,
    options?: DispatchOptions,
  ): void;
  clearError(path: FieldPath<TValues>, options?: DispatchOptions): void;
  setTouched(
    path: FieldPath<TValues>,
    value?: boolean,
    options?: DispatchOptions,
  ): void;
  setDirty(
    path: FieldPath<TValues>,
    value?: boolean,
    options?: DispatchOptions,
  ): void;
  focus(path: FieldPath<TValues>, options?: DispatchOptions): void;
  blur(path: FieldPath<TValues>, options?: DispatchOptions): void;
  validate(path: FieldPath<TValues>, options?: DispatchOptions): void;
  reset(path: FieldPath<TValues>, options?: DispatchOptions): void;
  pendingStart(path: FieldPath<TValues>, options?: DispatchOptions): void;
  pendingEnd(path: FieldPath<TValues>, options?: DispatchOptions): void;
  select: {
    value<P extends Path<TValues>>(
      path: P,
    ): Selector<TValues, TError, PathValue<TValues, P>>;
    value(path: string): Selector<TValues, TError, unknown>;
    error(
      path: FieldPath<TValues>,
    ): Selector<TValues, TError, TError | undefined>;
    dirty(path: FieldPath<TValues>): Selector<TValues, TError, boolean>;
    touched(path: FieldPath<TValues>): Selector<TValues, TError, boolean>;
    pending(path: FieldPath<TValues>): Selector<TValues, TError, boolean>;
    focused(path: FieldPath<TValues>): Selector<TValues, TError, boolean>;
    fieldState<P extends Path<TValues>>(
      path: P,
    ): Selector<TValues, TError, FieldState<TError, PathValue<TValues, P>>>;
    fieldState(path: string): Selector<TValues, TError, FieldState<TError>>;
  };
}
