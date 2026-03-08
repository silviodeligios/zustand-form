import type { FormState } from "../core/types";
import type { FieldState, FieldNamespace } from "./types";
import { getIn } from "../core/utils";

export function createFieldSelectors<
  TValues,
  TError = string,
>(): FieldNamespace<TValues, TError>["select"] {
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

  const cache = {
    value: new Map<string, Sel<unknown>>(),
    error: new Map<string, Sel<TError | undefined>>(),
    dirty: new Map<string, Sel<boolean>>(),
    touched: new Map<string, Sel<boolean>>(),
    pending: new Map<string, Sel<boolean>>(),
    focused: new Map<string, Sel<boolean>>(),
    fieldState: new Map<string, Sel<FieldState<TError>>>(),
  };

  return {
    value: (path: string): Sel<unknown> =>
      cached(cache.value, path, () => (s) => getIn(s.values, path)),
    error: (path: string): Sel<TError | undefined> =>
      cached(cache.error, path, () => (s) => s.errors[path]),
    dirty: (path: string): Sel<boolean> =>
      cached(cache.dirty, path, () => (s) => s.dirtyFields[path] ?? false),
    touched: (path: string): Sel<boolean> =>
      cached(cache.touched, path, () => (s) => s.touchedFields[path] ?? false),
    pending: (path: string): Sel<boolean> =>
      cached(cache.pending, path, () => (s) => s.pendingFields[path] ?? false),
    focused: (path: string): Sel<boolean> =>
      cached(cache.focused, path, () => (s) => s.focusedField === path),
    fieldState: (path: string): Sel<FieldState<TError>> =>
      cached(cache.fieldState, path, () => (s) => ({
        value: getIn(s.values, path),
        dirty: s.dirtyFields[path] ?? false,
        touched: s.touchedFields[path] ?? false,
        error: s.errors[path],
        pending: s.pendingFields[path] ?? false,
        focused: s.focusedField === path,
      })),
  };
}
