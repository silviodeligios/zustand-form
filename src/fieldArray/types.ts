import type { FormState, DispatchOptions } from "../core/types";
import type { Path, PathValue, ArrayElement } from "../types/paths";

export interface FieldArrayItem {
  id: string;
  index: number;
}

type Selector<TValues, TError, R> = (s: FormState<TValues, TError>) => R;

/** Accepts Path<TValues> for autocomplete, or any string for dynamic paths */
type FieldPath<TValues> = Path<TValues> | (string & Record<never, never>);

export interface FieldArrayNamespace<TValues, TError = string> {
  getLength(path: FieldPath<TValues>): number;
  setValue<P extends Path<TValues>>(
    path: P,
    arr: ArrayElement<PathValue<TValues, P>>[],
    options?: DispatchOptions,
  ): void;
  setValue(path: string, arr: unknown[], options?: DispatchOptions): void;
  append<P extends Path<TValues>>(
    path: P,
    value: ArrayElement<PathValue<TValues, P>>,
    options?: DispatchOptions,
  ): void;
  append(path: string, value: unknown, options?: DispatchOptions): void;
  prepend<P extends Path<TValues>>(
    path: P,
    value: ArrayElement<PathValue<TValues, P>>,
    options?: DispatchOptions,
  ): void;
  prepend(path: string, value: unknown, options?: DispatchOptions): void;
  remove(
    path: FieldPath<TValues>,
    index: number,
    options?: DispatchOptions,
  ): void;
  insert<P extends Path<TValues>>(
    path: P,
    index: number,
    value: ArrayElement<PathValue<TValues, P>>,
    options?: DispatchOptions,
  ): void;
  insert(
    path: string,
    index: number,
    value: unknown,
    options?: DispatchOptions,
  ): void;
  move(
    path: FieldPath<TValues>,
    from: number,
    to: number,
    options?: DispatchOptions,
  ): void;
  swap(
    path: FieldPath<TValues>,
    indexA: number,
    indexB: number,
    options?: DispatchOptions,
  ): void;
  select: {
    length(path: FieldPath<TValues>): Selector<TValues, TError, number>;
  };
}
