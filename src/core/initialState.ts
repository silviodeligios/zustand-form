import type { FormState, NamedEnhancer } from "./types";
import { scanArrayKeys } from "../utils/arrayKeys";

export interface InitialStateResult<TValues, TError> {
  /** Full initial state with real array values and scanned arrayKeys */
  initialState: FormState<TValues, TError>;
  /** Original user-facing default values (unchanged) */
  defaultValues: TValues;
  /** Snapshot of initial arrayKeys (for dirty reorder detection) */
  initialArrayKeys: Record<string, string[]>;
}

/**
 * Build the fully resolved initial state for a form.
 *
 * 1. Merges config.initialState with base defaults
 * 2. Applies initialState contributions from preview enhancers
 * 3. Scans values for arrays and builds arrayKeys (values stay as real arrays)
 */
export function buildInitialState<TValues, TError = string>(
  configInitialState: Partial<FormState<TValues, TError>>,
  previewEnhancers: NamedEnhancer<TValues, TError>[],
): InitialStateResult<TValues, TError> {
  const base: FormState<TValues, TError> = {
    values: {} as TValues,
    arrayKeys: {},
    _keyCounter: 0,
    dirtyFields: {},
    touchedFields: {},
    errors: {},
    pendingFields: {},
    focusedField: null,
    isSubmitting: false,
    submitCount: 0,
    isSubmitSuccessful: false,
    ...configInitialState,
  };

  let merged = base;
  for (const e of previewEnhancers) {
    if (e.initialState) {
      const patch =
        typeof e.initialState === "function"
          ? e.initialState(merged)
          : e.initialState;
      merged = { ...merged, ...patch };
    }
  }

  const defaultValues = merged.values;

  const { arrayKeys: initAk, nextCounter: initCounter } =
    scanArrayKeys(merged.values, "", merged._keyCounter);

  const initialState: FormState<TValues, TError> = {
    ...merged,
    arrayKeys: initAk,
    _keyCounter: initCounter,
  };

  return {
    initialState,
    defaultValues,
    initialArrayKeys: initAk,
  };
}
