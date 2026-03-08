import type { Dispatch } from "../core/types";
import type { ArrayReindexOp } from "../utils/arrayReindex";
import {
  reindexMap,
  computeNewIndex,
  parsePathIndex,
} from "../utils/arrayReindex";
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
  /** Reindex all internal maps after an array operation */
  reindex(arrayPath: string, op: ArrayReindexOp): void;
  /** Create an async session that tracks the current path across reindex ops */
  createSession(path: string, version: number): number;
  /** Get a session by ID (path may have been updated by reindex) */
  getSession(id: number): { path: string; version: number } | undefined;
  /** Delete a session */
  deleteSession(id: number): void;
}

export function createFieldRegistry<TError = string>(
  dispatch: Dispatch,
): FieldRegistry<TError> {
  const validators = new Map<string, FieldValidatorEntry<TError>>();
  const asyncVersions = new Map<string, number>();
  const asyncTimers = new Map<string, ReturnType<typeof setTimeout>>();
  /** Paths that were moved by a reindex op — unregister should skip cleanup for these */
  const reindexedPaths = new Set<string>();
  /** Tracks in-flight async validations with mutable path that gets updated on reindex */
  const asyncSessions = new Map<number, { path: string; version: number }>();
  let sessionCounter = 0;

  return {
    register(path, entry) {
      validators.set(path, entry);
      if (!asyncVersions.has(path)) asyncVersions.set(path, 0);
    },

    unregister(path) {
      // After array reindex, React's useEffect cleanup calls unregister for old paths.
      // Skip cleanup to avoid invalidating async state that was correctly reindexed.
      if (reindexedPaths.delete(path)) return;

      validators.delete(path);
      // Cancel in-flight async validation
      const timer = asyncTimers.get(path);
      if (timer) clearTimeout(timer);
      asyncTimers.delete(path);
      // Invalidate any pending promise
      asyncVersions.set(path, (asyncVersions.get(path) ?? 0) + 1);
      // Clear pending state
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

    reindex(arrayPath, op) {
      const prefix = arrayPath + ".";

      // 1. Reindex validators and timers, tracking moved paths for React cleanup
      reindexMap(validators, arrayPath, op, undefined, (oldKey) => {
        reindexedPaths.add(oldKey);
      });
      // Clear after React effects have run
      setTimeout(() => reindexedPaths.clear(), 0);

      reindexMap(asyncTimers, arrayPath, op, (_key, timer) => {
        clearTimeout(timer);
      });

      // 2. Reindex versions
      reindexMap(asyncVersions, arrayPath, op);

      // 3. Update session paths (no redirects, no cycles)
      for (const [id, session] of asyncSessions) {
        const parsed = parsePathIndex(session.path, prefix);
        if (!parsed) continue;
        const newIdx = computeNewIndex(parsed.index, op);
        if (newIdx === null) {
          asyncSessions.delete(id);
        } else {
          session.path = prefix + String(newIdx) + parsed.suffix;
        }
      }
    },

    createSession(path, version) {
      const id = ++sessionCounter;
      asyncSessions.set(id, { path, version });
      return id;
    },

    getSession: (id) => asyncSessions.get(id),
    deleteSession: (id) => {
      asyncSessions.delete(id);
    },
  };
}
