import type { Dispatch } from "../core/types";
import * as A from "../core/actions";
import type { FieldValidatorEntry } from "./types";

export interface FieldRegistry<TError = string> {
  register(path: string, entry: FieldValidatorEntry<TError>): void;
  unregister(path: string): void;
  get(path: string): FieldValidatorEntry<TError> | undefined;
  getAll(): Map<string, FieldValidatorEntry<TError>>;
  /** Get and increment the async version for a path (for stale cancellation) */
  nextVersion(path: string): number;
  /** Get current async version for a path */
  getVersion(path: string): number;
  /** Store a debounce timer for a path */
  setTimer(path: string, timer: ReturnType<typeof setTimeout>): void;
  /** Clear debounce timer for a path */
  clearTimer(path: string): void;
  /** Remove all registry entries whose path starts with the given prefix */
  removeByPrefix(prefix: string): void;
}

export function createFieldRegistry<TError = string>(
  dispatch: Dispatch,
): FieldRegistry<TError> {
  const validators = new Map<string, FieldValidatorEntry<TError>>();
  const asyncVersions = new Map<string, number>();
  const asyncTimers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    register(path, entry) {
      validators.set(path, entry);
      if (!asyncVersions.has(path)) asyncVersions.set(path, 0);
    },

    unregister(path) {
      validators.delete(path);
      const timer = asyncTimers.get(path);
      if (timer) clearTimeout(timer);
      asyncTimers.delete(path);
      // Only bump version if the path still exists — avoids re-adding entries
      // that were already cleaned up by removeByPrefix.
      if (asyncVersions.has(path)) {
        asyncVersions.set(path, asyncVersions.get(path)! + 1);
      }
      dispatch({ type: A.ASYNC_RESOLVE, path });
    },

    get: (path) => validators.get(path),
    getAll: () => validators,

    nextVersion(path) {
      const next = (asyncVersions.get(path) ?? 0) + 1;
      asyncVersions.set(path, next);
      return next;
    },

    getVersion: (path) => asyncVersions.get(path) ?? 0,

    setTimer(path, timer) {
      const prev = asyncTimers.get(path);
      if (prev) clearTimeout(prev);
      asyncTimers.set(path, timer);
    },

    clearTimer(path) {
      const timer = asyncTimers.get(path);
      if (timer) clearTimeout(timer);
      asyncTimers.delete(path);
    },

    removeByPrefix(prefix) {
      const dotPrefix = prefix + ".";
      for (const [p] of validators) {
        if (p === prefix || p.startsWith(dotPrefix)) {
          validators.delete(p);
        }
      }
      for (const [p, timer] of asyncTimers) {
        if (p === prefix || p.startsWith(dotPrefix)) {
          clearTimeout(timer);
          asyncTimers.delete(p);
        }
      }
      for (const [p] of asyncVersions) {
        if (p === prefix || p.startsWith(dotPrefix)) {
          asyncVersions.delete(p);
        }
      }
    },
  };
}
