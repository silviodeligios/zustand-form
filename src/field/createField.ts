import type { StoreApi } from "zustand/vanilla";
import type { FormState, Dispatch } from "../core/types";
import type { FieldNamespace } from "./types";
import * as A from "../core/actions";
import { getIn } from "../core/utils";
import { createFieldSelectors } from "./selectors";

export function createFieldNamespace<TValues, TError = string>(
  store: StoreApi<FormState<TValues, TError>>,
  dispatch: Dispatch,
): FieldNamespace<TValues, TError> {
  const s = () => store.getState();

  return {
    getValue: (path) => getIn(s().values, path),
    isDirty: (path) => s().dirtyFields[path] === true,
    isTouched: (path) => s().touchedFields[path] === true,
    isPending: (path) => s().pendingFields[path] === true,
    getError: (path) => s().errors[path],

    setValue: (path, v, opts?) =>
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
    pendingStart: (path, opts?) =>
      dispatch({ type: A.PENDING_START, path, options: opts }),
    pendingEnd: (path, opts?) =>
      dispatch({ type: A.PENDING_END, path, options: opts }),

    select: createFieldSelectors<TValues, TError>(),
  };
}
