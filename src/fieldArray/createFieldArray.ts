import type { StoreApi } from "zustand/vanilla";
import type { FormState, Dispatch } from "../core/types";
import type { FieldArrayNamespace } from "./types";
import * as A from "../core/actions";
import { getInArray } from "../utils/paths";
import { cached } from "../utils/cache";
import { indexPathToKeyPath } from "../utils/arrayKeys";

export function createFieldArrayNamespace<TValues, TError = string>(
  store: StoreApi<FormState<TValues, TError>>,
  dispatch: Dispatch,
): FieldArrayNamespace<TValues, TError> {
  type Sel<R> = (s: FormState<TValues, TError>) => R;

  const s = () => store.getState();

  const kp = (path: string) => indexPathToKeyPath(path, s().arrayKeys);

  const lengthCache = new Map<string, Sel<number>>();
  const keysCache = new Map<string, Sel<string[]>>();

  return {
    getLength: (path) => (s().arrayKeys[kp(path)] ?? []).length,
    getKeys: (path) => s().arrayKeys[kp(path)] ?? [],
    append: (path: string, v: unknown, opts?: { disableLayers?: string[] }) =>
      dispatch({ type: A.ARRAY_APPEND, path, value: v, options: opts }),
    prepend: (path: string, v: unknown, opts?: { disableLayers?: string[] }) =>
      dispatch({ type: A.ARRAY_INSERT, path, index: 0, value: v, options: opts }),
    remove: (path: string, i: number, opts?: { disableLayers?: string[] }) =>
      dispatch({ type: A.ARRAY_REMOVE, path, index: i, options: opts }),
    insert: (
      path: string,
      i: number,
      v: unknown,
      opts?: { disableLayers?: string[] },
    ) =>
      dispatch({ type: A.ARRAY_INSERT, path, index: i, value: v, options: opts }),
    move: (path, f, t, opts?) =>
      dispatch({ type: A.ARRAY_MOVE, path, from: f, to: t, options: opts }),
    replace: (path: string, v: unknown, opts?: { disableLayers?: string[] }) =>
      dispatch({ type: A.SET_TREE_VALUE, path, value: v, options: opts }),
    swap: (path, a, b, opts?) =>
      dispatch({ type: A.ARRAY_SWAP, path, from: a, to: b, options: opts }),
    sort: (path: string, comparator: (a: unknown, b: unknown) => number, opts?) => {
      const state = s();
      const arr = getInArray(state.values, path);
      const indices = arr.map((_: unknown, i: number) => i);
      indices.sort((a: number, b: number) => comparator(arr[a], arr[b]));
      dispatch({ type: A.ARRAY_SORT, path, permutation: indices, options: opts });
    },
    reorder: (path: string, permutation: number[], opts?) =>
      dispatch({ type: A.ARRAY_SORT, path, permutation, options: opts }),

    select: {
      length: (path): Sel<number> =>
        cached(
          lengthCache,
          path,
          () => (s) => {
            const keyPath = indexPathToKeyPath(path, s.arrayKeys);
            return (s.arrayKeys[keyPath] ?? []).length;
          },
        ),
      keys: (path): Sel<string[]> =>
        cached(
          keysCache,
          path,
          () => (s) => {
            const keyPath = indexPathToKeyPath(path, s.arrayKeys);
            return s.arrayKeys[keyPath] ?? [];
          },
        ),
    },
  };
}
