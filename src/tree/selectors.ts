import type { FormState } from "../core/types";
import type { DeepLeaf } from "./types";
import { cached } from "../utils/cache";
import { indexPathToKeyPath, unflattenToNested } from "../utils/arrayKeys";

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
    errors: new Map<string, Sel<DeepLeaf<TValues, TError>>>(),
    dirtyFields: new Map<string, Sel<DeepLeaf<TValues, boolean>>>(),
    touchedFields: new Map<string, Sel<DeepLeaf<TValues, boolean>>>(),
    errorCount: new Map<string, Sel<number>>(),
  };

  const cacheKey = (path?: string) => path ?? "";

  /** Resolve path to key-based, returning both the key prefix and the matcher. */
  function keyPrefixFor(
    path: string | undefined,
    ak: Record<string, string[]>,
  ): string | undefined {
    return path ? indexPathToKeyPath(path, ak) : undefined;
  }

  function matchFor(path: string | undefined, ak: Record<string, string[]>) {
    return getMatcher(keyPrefixFor(path, ak));
  }

  function* boolEntries(
    record: Record<string, boolean>,
    match: (k: string) => boolean,
  ): Iterable<readonly [string, true]> {
    for (const k of Object.keys(record)) {
      if (match(k)) yield [k, true] as const;
    }
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
    errors: (path?: string): Sel<DeepLeaf<TValues, TError>> => {
      const k = cacheKey(path);
      return cached(
        cache.errors,
        k,
        () => (s) => {
          const kp = keyPrefixFor(path, s.arrayKeys);
          const match = getMatcher(kp);
          const flat = filterErrors(s, match);
          return unflattenToNested(
            Object.entries(flat),
            s.arrayKeys,
            kp,
          ) as DeepLeaf<TValues, TError>;
        },
      );
    },
    dirtyFields: (path?: string): Sel<DeepLeaf<TValues, boolean>> => {
      const k = cacheKey(path);
      return cached(
        cache.dirtyFields,
        k,
        () => (s) => {
          const kp = keyPrefixFor(path, s.arrayKeys);
          const match = getMatcher(kp);
          return unflattenToNested(
            boolEntries(s.dirtyFields, match),
            s.arrayKeys,
            kp,
          ) as DeepLeaf<TValues, boolean>;
        },
      );
    },
    touchedFields: (path?: string): Sel<DeepLeaf<TValues, boolean>> => {
      const k = cacheKey(path);
      return cached(
        cache.touchedFields,
        k,
        () => (s) => {
          const kp = keyPrefixFor(path, s.arrayKeys);
          const match = getMatcher(kp);
          return unflattenToNested(
            boolEntries(s.touchedFields, match),
            s.arrayKeys,
            kp,
          ) as DeepLeaf<TValues, boolean>;
        },
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
