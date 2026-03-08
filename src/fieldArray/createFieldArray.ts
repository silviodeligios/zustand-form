import type { StoreApi } from "zustand/vanilla";
import type { FormState, Dispatch } from "../core/types";
import type { FieldArrayNamespace } from "./types";
import * as A from "../core/actions";
import { getInArray } from "../core/utils";

export function createFieldArrayNamespace<TValues, TError = string>(
  store: StoreApi<FormState<TValues, TError>>,
  dispatch: Dispatch,
): FieldArrayNamespace<TValues, TError> {
  type Sel<R> = (s: FormState<TValues, TError>) => R;

  function cached<R>(
    map: Map<string, Sel<R>>,
    path: string,
    factory: () => Sel<R>,
  ): Sel<R> {
    let sel = map.get(path);
    if (!sel) {
      sel = factory();
      map.set(path, sel);
    }
    return sel;
  }

  const s = () => store.getState();

  const lengthCache = new Map<string, Sel<number>>();

  return {
    getLength: (path) => getInArray(s().values, path).length,
    append: (path: string, v: unknown, opts?: { disableLayers?: string[] }) =>
      dispatch({ type: A.ARRAY_APPEND, path, value: v, options: opts }),
    prepend: (path: string, v: unknown, opts?: { disableLayers?: string[] }) =>
      dispatch({
        type: A.ARRAY_INSERT,
        path,
        index: 0,
        value: v,
        options: opts,
      }),
    remove: (path: string, i: number, opts?: { disableLayers?: string[] }) =>
      dispatch({ type: A.ARRAY_REMOVE, path, index: i, options: opts }),
    insert: (
      path: string,
      i: number,
      v: unknown,
      opts?: { disableLayers?: string[] },
    ) =>
      dispatch({
        type: A.ARRAY_INSERT,
        path,
        index: i,
        value: v,
        options: opts,
      }),
    move: (path, f, t, opts?) =>
      dispatch({ type: A.ARRAY_MOVE, path, from: f, to: t, options: opts }),
    replace: (path: string, v: unknown, opts?: { disableLayers?: string[] }) =>
      dispatch({ type: A.ARRAY_REPLACE, path, value: v, options: opts }),
    swap: (path, a, b, opts?) =>
      dispatch({ type: A.ARRAY_SWAP, path, from: a, to: b, options: opts }),

    select: {
      length: (path): Sel<number> =>
        cached(
          lengthCache,
          path,
          () => (s) => getInArray(s.values, path).length,
        ),
    },
  };
}
