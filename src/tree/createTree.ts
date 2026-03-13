import type { StoreApi } from "zustand/vanilla";
import type { FormState, Dispatch } from "../core/types";
import type { TreeNamespace } from "./types";
import * as A from "../core/actions";
import { treeMatcher } from "../utils/tree";
import { indexPathToKeyPath } from "../utils/arrayKeys";
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
  function matchFor(path: string | undefined, ak: Record<string, string[]>) {
    const kp = path ? indexPathToKeyPath(path, ak) : path;
    return getMatcher(kp);
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
      return filterErrors(state, matchFor(path, state.arrayKeys));
    },
    getDirtyFields: (path?) => {
      const state = s();
      return Object.keys(state.dirtyFields).filter(matchFor(path, state.arrayKeys));
    },
    getTouchedFields: (path?) => {
      const state = s();
      return Object.keys(state.touchedFields).filter(matchFor(path, state.arrayKeys));
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
