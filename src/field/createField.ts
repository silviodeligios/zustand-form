import type { StoreApi } from "zustand/vanilla";
import type { FormState, Dispatch } from "../core/types";
import type { FieldNamespace } from "./types";
import type { Path, PathValue } from "../types/paths";
import * as A from "../core/actions";
import { createFieldSelectors } from "./selectors";
import { indexPathToKeyPath, getValueAtKeyPath } from "../utils/arrayKeys";

export function createFieldNamespace<TValues, TError = string>(
  store: StoreApi<FormState<TValues, TError>>,
  dispatch: Dispatch,
): FieldNamespace<TValues, TError> {
  const s = () => store.getState();
  const kp = (path: string) => indexPathToKeyPath(path, s().arrayKeys);

  return {
    getValue: <P extends Path<TValues>>(path: P) => {
      const state = s();
      return getValueAtKeyPath(state.values, path, state.arrayKeys) as PathValue<TValues, P>;
    },
    isDirty: (path) => s().dirtyFields[kp(path)] === true,
    isTouched: (path) => s().touchedFields[kp(path)] === true,
    isPending: (path) => s().pendingFields[kp(path)] === true,
    getError: (path) => s().errors[kp(path)],

    setValue: (path: string, v: unknown, opts?: { disableLayers?: string[] }) =>
      dispatch({ type: A.SET_VALUE, path, value: v, options: opts }),
    setError: (path, msg, opts?) =>
      dispatch({ type: A.SET_ERROR, path, value: msg, options: opts }),
    clearError: (path, opts?) =>
      dispatch({ type: A.CLEAR_ERROR, path, options: opts }),
    setTouched: (path, v = true, opts?) =>
      dispatch({ type: A.SET_TOUCHED, path, value: v, options: opts }),
    setDirty: (path, v = true, opts?) =>
      dispatch({ type: A.SET_DIRTY, path, value: v, options: opts }),
    focus: (path, opts?) => dispatch({ type: A.FOCUS, path, options: opts }),
    blur: (path, opts?) => dispatch({ type: A.BLUR, path, options: opts }),
    validate: (path, opts?) =>
      dispatch({ type: A.VALIDATE_FIELD, path, options: opts }),
    reset: (path, opts?) =>
      dispatch({ type: A.RESET_FIELD, path, options: opts }),
    select: createFieldSelectors<TValues, TError>(dispatch),
  };
}
