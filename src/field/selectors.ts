import type { FormState } from "../core/types";
import type { FieldState } from "./types";
import { getIn } from "../core/utils";

type Selector<R> = (s: FormState<unknown, unknown>) => R;

function cached<R>(
  map: Map<string, Selector<R>>,
  path: string,
  factory: () => Selector<R>,
): Selector<R> {
  let sel = map.get(path);
  if (!sel) {
    sel = factory();
    map.set(path, sel);
  }
  return sel;
}

export function createFieldSelectors<TValues, TError = string>() {
  const cache = {
    value: new Map<string, Selector<unknown>>(),
    error: new Map<string, Selector<TError | undefined>>(),
    dirty: new Map<string, Selector<boolean>>(),
    touched: new Map<string, Selector<boolean>>(),
    pending: new Map<string, Selector<boolean>>(),
    focused: new Map<string, Selector<boolean>>(),
    fieldState: new Map<string, Selector<FieldState<TError>>>(),
  };

  return {
    value: (path: string) =>
      cached(cache.value, path, () => (s) => getIn(s.values, path)) as (
        s: FormState<TValues, TError>,
      ) => unknown,
    error: (path: string) =>
      cached(
        cache.error,
        path,
        () => (s) => s.errors[path] as TError | undefined,
      ) as (s: FormState<TValues, TError>) => TError | undefined,
    dirty: (path: string) =>
      cached(cache.dirty, path, () => (s) => s.dirtyFields[path] ?? false) as (
        s: FormState<TValues, TError>,
      ) => boolean,
    touched: (path: string) =>
      cached(
        cache.touched,
        path,
        () => (s) => s.touchedFields[path] ?? false,
      ) as (s: FormState<TValues, TError>) => boolean,
    pending: (path: string) =>
      cached(
        cache.pending,
        path,
        () => (s) => s.pendingFields[path] ?? false,
      ) as (s: FormState<TValues, TError>) => boolean,
    focused: (path: string) =>
      cached(cache.focused, path, () => (s) => s.focusedField === path) as (
        s: FormState<TValues, TError>,
      ) => boolean,
    fieldState: (path: string) =>
      cached(cache.fieldState, path, () => (s) => ({
        value: getIn(s.values, path),
        dirty: s.dirtyFields[path] ?? false,
        touched: s.touchedFields[path] ?? false,
        error: s.errors[path] as TError | undefined,
        pending: s.pendingFields[path] ?? false,
        focused: s.focusedField === path,
      })) as (s: FormState<TValues, TError>) => FieldState<TError>,
  };
}
