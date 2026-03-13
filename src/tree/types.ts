import type { FormState, DispatchOptions } from "../core/types";
import type { Path } from "../types/paths";

type Selector<TValues, TError, R> = (s: FormState<TValues, TError>) => R;

/** Accepts Path<TValues> for autocomplete, or any string for dynamic paths */
type FieldPath<TValues> = Path<TValues> | (string & Record<never, never>);

/** Nested structure mirroring the values shape with `L` at the leaves */
export type DeepLeaf<T, L> = T extends (infer U)[]
  ? (DeepLeaf<U, L> | undefined)[]
  : T extends Record<string, unknown>
    ? { [K in keyof T]?: DeepLeaf<T[K], L> }
    : L;

export interface TreeNamespace<TValues, TError = string> {
  isDirty(path?: FieldPath<TValues>): boolean;
  isTouched(path?: FieldPath<TValues>): boolean;
  isPending(path?: FieldPath<TValues>): boolean;
  isValid(path?: FieldPath<TValues>): boolean;
  getErrors(path?: FieldPath<TValues>): DeepLeaf<TValues, TError>;
  getDirtyFields(path?: FieldPath<TValues>): DeepLeaf<TValues, boolean>;
  getTouchedFields(path?: FieldPath<TValues>): DeepLeaf<TValues, boolean>;
  setValue(value: TValues): void;
  setValue(path: FieldPath<TValues>, value: unknown): void;
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
    ): Selector<TValues, TError, DeepLeaf<TValues, TError>>;
    dirtyFields(
      path?: FieldPath<TValues>,
    ): Selector<TValues, TError, DeepLeaf<TValues, boolean>>;
    touchedFields(
      path?: FieldPath<TValues>,
    ): Selector<TValues, TError, DeepLeaf<TValues, boolean>>;
    errorCount(path?: FieldPath<TValues>): Selector<TValues, TError, number>;
  };
}
