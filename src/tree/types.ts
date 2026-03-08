import type { FormState, DispatchOptions } from "../core/types";
import type { Path } from "../types/paths";

type Selector<TValues, TError, R> = (s: FormState<TValues, TError>) => R;

/** Accepts Path<TValues> for autocomplete, or any string for dynamic paths */
type FieldPath<TValues> = Path<TValues> | (string & Record<never, never>);

export interface TreeNamespace<TValues, TError = string> {
  isDirty(path?: FieldPath<TValues>): boolean;
  isTouched(path?: FieldPath<TValues>): boolean;
  isPending(path?: FieldPath<TValues>): boolean;
  isValid(path?: FieldPath<TValues>): boolean;
  getErrors(path?: FieldPath<TValues>): Record<string, TError>;
  getDirtyFields(path?: FieldPath<TValues>): string[];
  getTouchedFields(path?: FieldPath<TValues>): string[];
  clearErrors(path?: FieldPath<TValues>, options?: DispatchOptions): void;
  reset(path?: FieldPath<TValues>, options?: DispatchOptions): void;
  validate(path?: FieldPath<TValues>, options?: DispatchOptions): void;
  select: {
    dirty(path?: FieldPath<TValues>): Selector<TValues, TError, boolean>;
    touched(path?: FieldPath<TValues>): Selector<TValues, TError, boolean>;
    pending(path?: FieldPath<TValues>): Selector<TValues, TError, boolean>;
    valid(path?: FieldPath<TValues>): Selector<TValues, TError, boolean>;
    errors(
      path?: FieldPath<TValues>,
    ): Selector<TValues, TError, Record<string, TError>>;
    dirtyFields(path?: FieldPath<TValues>): Selector<TValues, TError, string[]>;
    touchedFields(
      path?: FieldPath<TValues>,
    ): Selector<TValues, TError, string[]>;
    errorCount(path?: FieldPath<TValues>): Selector<TValues, TError, number>;
  };
}
