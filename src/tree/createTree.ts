import type { StoreApi } from "zustand/vanilla";
import type { FormState, Dispatch } from "../core/types";
import type { TreeNamespace, DeepLeaf } from "./types";
import * as A from "../core/actions";
import { treeMatcher } from "../utils/tree";
import { indexPathToKeyPath, unflattenToNested } from "../utils/arrayKeys";
import { createTreeSelectors } from "./selectors";

export function createTreeNamespace<TValues, TError = string>(
  store: StoreApi<FormState<TValues, TError>>,
  dispatch: Dispatch,
): TreeNamespace<TValues, TError> {
  const s = () => store.getState();
  const matcherCache = new Map<string, (key: string) => boolean>();

  function getMatcher(path?: string): (key: string) => boolean {
    const key = path ?? "";
    let m = matcherCache.get(key);
    if (!m) {
      m = treeMatcher(path);
      matcherCache.set(key, m);
    }
    return m;
  }

  /** Normalize an index-based path to key-based, then get a cached matcher. */
  function keyPrefixFor(
    path: string | undefined,
    ak: Record<string, string[]>,
  ): string | undefined {
    return path ? indexPathToKeyPath(path, ak) : undefined;
  }

  function matchFor(path: string | undefined, ak: Record<string, string[]>) {
    return getMatcher(keyPrefixFor(path, ak));
  }

  function filterErrors(
    state: FormState<TValues, TError>,
    match: (k: string) => boolean,
  ): Record<string, TError> {
    const result: Record<string, TError> = {};
    for (const k of Object.keys(state.errors)) {
      const v = state.errors[k];
      if (match(k) && v !== undefined) result[k] = v;
    }
    return result;
  }

  /** Collect matching boolean-record keys as [keyPath, true] entries */
  function* boolEntries(
    record: Record<string, boolean>,
    match: (k: string) => boolean,
  ): Iterable<readonly [string, true]> {
    for (const k of Object.keys(record)) {
      if (match(k)) yield [k, true] as const;
    }
  }

  return {
    isDirty: (path?) => {
      const state = s();
      return Object.keys(state.dirtyFields).some(matchFor(path, state.arrayKeys));
    },
    isTouched: (path?) => {
      const state = s();
      return Object.keys(state.touchedFields).some(matchFor(path, state.arrayKeys));
    },
    isPending: (path?) => {
      const state = s();
      return Object.keys(state.pendingFields).some(matchFor(path, state.arrayKeys));
    },
    isValid: (path?) => {
      const state = s();
      const match = matchFor(path, state.arrayKeys);
      return !Object.keys(state.errors).some(
        (k) => match(k) && state.errors[k] !== undefined,
      );
    },
    getErrors: (path?) => {
      const state = s();
      const kp = keyPrefixFor(path, state.arrayKeys);
      const match = getMatcher(kp);
      const flat = filterErrors(state, match);
      return unflattenToNested(
        Object.entries(flat),
        state.arrayKeys,
        kp,
      ) as DeepLeaf<TValues, TError>;
    },
    getDirtyFields: (path?) => {
      const state = s();
      const kp = keyPrefixFor(path, state.arrayKeys);
      const match = getMatcher(kp);
      return unflattenToNested(
        boolEntries(state.dirtyFields, match),
        state.arrayKeys,
        kp,
      ) as DeepLeaf<TValues, boolean>;
    },
    getTouchedFields: (path?) => {
      const state = s();
      const kp = keyPrefixFor(path, state.arrayKeys);
      const match = getMatcher(kp);
      return unflattenToNested(
        boolEntries(state.touchedFields, match),
        state.arrayKeys,
        kp,
      ) as DeepLeaf<TValues, boolean>;
    },

    setValue: (...args: [unknown] | [string, unknown]) => {
      if (typeof args[0] === "string") {
        dispatch({ type: A.SET_TREE_VALUE, path: args[0], value: args[1] });
      } else {
        dispatch({ type: A.SET_TREE_VALUE, value: args[0] });
      }
    },
    clearErrors: (path?, opts?) =>
      dispatch({ type: A.CLEAR_ERRORS_BRANCH, path, options: opts }),
    reset: (path?, opts?) =>
      dispatch({ type: A.RESET_BRANCH, path, options: opts }),
    validate: (path?, opts?) =>
      dispatch({ type: A.VALIDATE_BRANCH, path, options: opts }),

    select: createTreeSelectors<TValues, TError>(getMatcher, filterErrors),
  };
}
