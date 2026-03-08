import type { FormState } from "../core/types";

type Selector<R> = (s: FormState<unknown, unknown>) => R;

function cached<R>(
  map: Map<string, Selector<R>>,
  key: string,
  factory: () => Selector<R>,
): Selector<R> {
  let sel = map.get(key);
  if (!sel) {
    sel = factory();
    map.set(key, sel);
  }
  return sel;
}

export function createTreeSelectors<TValues, TError = string>(
  getMatcher: (path?: string) => (key: string) => boolean,
  filterErrors: (
    s: FormState<TValues, TError>,
    match: (k: string) => boolean,
  ) => Record<string, TError>,
) {
  const cache = {
    dirty: new Map<string, Selector<boolean>>(),
    touched: new Map<string, Selector<boolean>>(),
    pending: new Map<string, Selector<boolean>>(),
    valid: new Map<string, Selector<boolean>>(),
    errors: new Map<string, Selector<Record<string, TError>>>(),
    dirtyFields: new Map<string, Selector<string[]>>(),
    touchedFields: new Map<string, Selector<string[]>>(),
    errorCount: new Map<string, Selector<number>>(),
  };

  const cacheKey = (path?: string) => path ?? "";

  return {
    dirty: (path?: string) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.dirty,
        k,
        () => (s) => Object.keys(s.dirtyFields).some(match),
      ) as (s: FormState<TValues, TError>) => boolean;
    },
    touched: (path?: string) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.touched,
        k,
        () => (s) => Object.keys(s.touchedFields).some(match),
      ) as (s: FormState<TValues, TError>) => boolean;
    },
    pending: (path?: string) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.pending,
        k,
        () => (s) => Object.keys(s.pendingFields).some(match),
      ) as (s: FormState<TValues, TError>) => boolean;
    },
    valid: (path?: string) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.valid,
        k,
        () => (s) =>
          !Object.keys(s.errors).some(
            (key) => match(key) && s.errors[key] !== undefined,
          ),
      ) as (s: FormState<TValues, TError>) => boolean;
    },
    errors: (path?: string) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.errors,
        k,
        () => (s) => filterErrors(s as FormState<TValues, TError>, match),
      ) as (s: FormState<TValues, TError>) => Record<string, TError>;
    },
    dirtyFields: (path?: string) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.dirtyFields,
        k,
        () => (s) => Object.keys(s.dirtyFields).filter(match),
      ) as (s: FormState<TValues, TError>) => string[];
    },
    touchedFields: (path?: string) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.touchedFields,
        k,
        () => (s) => Object.keys(s.touchedFields).filter(match),
      ) as (s: FormState<TValues, TError>) => string[];
    },
    errorCount: (path?: string) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.errorCount,
        k,
        () => (s) =>
          Object.keys(s.errors).filter(
            (key) => match(key) && s.errors[key] !== undefined,
          ).length,
      ) as (s: FormState<TValues, TError>) => number;
    },
  };
}
