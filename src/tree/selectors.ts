import type { FormState } from "../core/types";
import { cached } from "../utils/cache";
import { indexPathToKeyPath } from "../utils/arrayKeys";

export function createTreeSelectors<TValues, TError = string>(
  getMatcher: (path?: string) => (key: string) => boolean,
  filterErrors: (
    s: FormState<TValues, TError>,
    match: (k: string) => boolean,
  ) => Record<string, TError>,
) {
  type Sel<R> = (s: FormState<TValues, TError>) => R;

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

  /** Resolve path to key-based using current arrayKeys, return cached matcher. */
  function matchFor(path: string | undefined, ak: Record<string, string[]>) {
    return getMatcher(path ? indexPathToKeyPath(path, ak) : path);
  }

  return {
    dirty: (path?: string): Sel<boolean> => {
      const k = cacheKey(path);
      return cached(
        cache.dirty,
        k,
        () => (s) => Object.keys(s.dirtyFields).some(matchFor(path, s.arrayKeys)),
      );
    },
    touched: (path?: string): Sel<boolean> => {
      const k = cacheKey(path);
      return cached(
        cache.touched,
        k,
        () => (s) => Object.keys(s.touchedFields).some(matchFor(path, s.arrayKeys)),
      );
    },
    pending: (path?: string): Sel<boolean> => {
      const k = cacheKey(path);
      return cached(
        cache.pending,
        k,
        () => (s) => Object.keys(s.pendingFields).some(matchFor(path, s.arrayKeys)),
      );
    },
    valid: (path?: string): Sel<boolean> => {
      const k = cacheKey(path);
      return cached(
        cache.valid,
        k,
        () => (s) => {
          const match = matchFor(path, s.arrayKeys);
          return !Object.keys(s.errors).some(
            (key) => match(key) && s.errors[key] !== undefined,
          );
        },
      );
    },
    errors: (path?: string): Sel<Record<string, TError>> => {
      const k = cacheKey(path);
      return cached(
        cache.errors,
        k,
        () => (s) => filterErrors(s, matchFor(path, s.arrayKeys)),
      );
    },
    dirtyFields: (path?: string): Sel<string[]> => {
      const k = cacheKey(path);
      return cached(
        cache.dirtyFields,
        k,
        () => (s) => Object.keys(s.dirtyFields).filter(matchFor(path, s.arrayKeys)),
      );
    },
    touchedFields: (path?: string): Sel<string[]> => {
      const k = cacheKey(path);
      return cached(
        cache.touchedFields,
        k,
        () => (s) => Object.keys(s.touchedFields).filter(matchFor(path, s.arrayKeys)),
      );
    },
    errorCount: (path?: string): Sel<number> => {
      const k = cacheKey(path);
      return cached(
        cache.errorCount,
        k,
        () => (s) => {
          const match = matchFor(path, s.arrayKeys);
          return Object.keys(s.errors).filter(
            (key) => match(key) && s.errors[key] !== undefined,
          ).length;
        },
      );
    },
  };
}
