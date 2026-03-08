import type { FormState, DispatchOptions } from "../core/types";

export interface FieldArrayItem {
  id: string;
  index: number;
}

type Selector<TValues, TError, R> = (s: FormState<TValues, TError>) => R;

export interface FieldArrayNamespace<TValues, TError = string> {
  getLength(path: string): number;
  setValue(path: string, arr: unknown[], options?: DispatchOptions): void;
  append(path: string, value: unknown, options?: DispatchOptions): void;
  prepend(path: string, value: unknown, options?: DispatchOptions): void;
  remove(path: string, index: number, options?: DispatchOptions): void;
  insert(
    path: string,
    index: number,
    value: unknown,
    options?: DispatchOptions,
  ): void;
  move(path: string, from: number, to: number, options?: DispatchOptions): void;
  swap(
    path: string,
    indexA: number,
    indexB: number,
    options?: DispatchOptions,
  ): void;
  select: {
    length(path: string): Selector<TValues, TError, number>;
  };
}
