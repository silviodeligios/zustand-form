import type { FormState } from "../core/types";

export function createTreeSelectors<TValues, TError = string>(
  getMatcher: (path?: string) => (key: string) => boolean,
  filterErrors: (
    s: FormState<TValues, TError>,
    match: (k: string) => boolean,
  ) => Record<string, TError>,
) {
  type Sel<R> = (s: FormState<TValues, TError>) => R;

  function cached<R>(
    map: Map<string, Sel<R>>,
    key: string,
    factory: () => Sel<R>,
  ): Sel<R> {
    let sel = map.get(key);
    if (!sel) {
      sel = factory();
      map.set(key, sel);
    }
    return sel;
  }

  const cache = {
    dirty: new Map<string, Sel<boolean>>(),
    touched: new Map<string, Sel<boolean>>(),
    pending: new Map<string, Sel<boolean>>(),
    valid: new Map<string, Sel<boolean>>(),
    errors: new Map<string, Sel<Record<string, TError>>>(),
    dirtyFields: new Map<string, Sel<string[]>>(),
    touchedFields: new Map<string, Sel<string[]>>(),
    errorCount: new Map<string, Sel<number>>(),
  };

  const cacheKey = (path?: string) => path ?? "";

  return {
    dirty: (path?: string): Sel<boolean> => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.dirty,
        k,
        () => (s) => Object.keys(s.dirtyFields).some(match),
      );
    },
    touched: (path?: string): Sel<boolean> => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.touched,
        k,
        () => (s) => Object.keys(s.touchedFields).some(match),
      );
    },
    pending: (path?: string): Sel<boolean> => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.pending,
        k,
        () => (s) => Object.keys(s.pendingFields).some(match),
      );
    },
    valid: (path?: string): Sel<boolean> => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.valid,
        k,
        () => (s) =>
          !Object.keys(s.errors).some(
            (key) => match(key) && s.errors[key] !== undefined,
          ),
      );
    },
    errors: (path?: string): Sel<Record<string, TError>> => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(cache.errors, k, () => (s) => filterErrors(s, match));
    },
    dirtyFields: (path?: string): Sel<string[]> => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.dirtyFields,
        k,
        () => (s) => Object.keys(s.dirtyFields).filter(match),
      );
    },
    touchedFields: (path?: string): Sel<string[]> => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.touchedFields,
        k,
        () => (s) => Object.keys(s.touchedFields).filter(match),
      );
    },
    errorCount: (path?: string): Sel<number> => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.errorCount,
        k,
        () => (s) =>
          Object.keys(s.errors).filter(
            (key) => match(key) && s.errors[key] !== undefined,
          ).length,
      );
    },
  };
}
