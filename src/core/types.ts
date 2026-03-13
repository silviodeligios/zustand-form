import type { StoreApi } from "zustand/vanilla";
import type * as A from "./actions";
import type { FieldNamespace } from "../field/types";
import type { TreeNamespace } from "../tree/types";
import type { FieldArrayNamespace } from "../fieldArray/types";
import type { FormSelectors } from "./selectors";
import type { FieldValidatorEntry } from "../validation/types";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface FormState<TValues, TError = string> {
  values: TValues;
  arrayKeys: Record<string, string[]>;
  _keyCounter: number;
  dirtyFields: Record<string, boolean>;
  touchedFields: Record<string, boolean>;
  errors: Record<string, TError | undefined>;
  pendingFields: Record<string, boolean>;
  focusedField: string | null;
  isSubmitting: boolean;
  submitCount: number;
  isSubmitSuccessful: boolean;
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export interface DispatchOptions {
  disableLayers?: string[];
}

export type ActionType =
  | typeof A.SET_VALUE
  | typeof A.SET_ERROR
  | typeof A.CLEAR_ERROR
  | typeof A.SET_TOUCHED
  | typeof A.SET_DIRTY
  | typeof A.FOCUS
  | typeof A.BLUR
  | typeof A.VALIDATE_FIELD
  | typeof A.RESET_FIELD
  | typeof A.ASYNC_RESOLVE
  | typeof A.CLEAR_ERRORS_BRANCH
  | typeof A.RESET_BRANCH
  | typeof A.VALIDATE_BRANCH
  | typeof A.SET_TREE_VALUE
  | typeof A.ARRAY_APPEND
  | typeof A.ARRAY_REMOVE
  | typeof A.ARRAY_INSERT
  | typeof A.ARRAY_MOVE
  | typeof A.ARRAY_SWAP
  | typeof A.ARRAY_SORT
  | typeof A.RESET_FORM
  | typeof A.SUBMIT
  | typeof A.SUBMIT_SUCCESS
  | typeof A.SUBMIT_FAILURE;

export interface ActionContext {
  type: ActionType;
  path?: string | undefined;
  value?: unknown;
  index?: number | undefined;
  from?: number | undefined;
  to?: number | undefined;
  permutation?: number[] | undefined;
  options?: DispatchOptions | undefined;
}

export type Dispatch = (ctx: ActionContext) => void;

/** Enhancer: receives context, previous state, accumulated draft; returns enriched draft */
export type Enhancer<TValues, TError = string> = (
  ctx: ActionContext,
  prev: FormState<TValues, TError>,
  draft: Partial<FormState<TValues, TError>>,
) => Partial<FormState<TValues, TError>>;

/** Named enhancer: wraps an Enhancer with a string tag for pipeline manipulation */
export interface NamedEnhancer<TValues, TError = string> {
  name: string;
  enhancer: Enhancer<TValues, TError>;
  /** Optional initial state contribution. Applied in pipeline order at form creation time.
   * Can be a partial state object or a function that receives the accumulated state so far
   * and returns a partial patch — mirrors the draft pattern used at dispatch time. */
  initialState?:
    | Partial<FormState<TValues, TError>>
    | ((
        state: FormState<TValues, TError>,
      ) => Partial<FormState<TValues, TError>>);
}

// ---------------------------------------------------------------------------
// Form (top-level interface)
// ---------------------------------------------------------------------------

export interface Form<TValues, TError = string> {
  getState: StoreApi<FormState<TValues, TError>>["getState"];
  setState: StoreApi<FormState<TValues, TError>>["setState"];
  subscribe: StoreApi<FormState<TValues, TError>>["subscribe"];
  getInitialState: StoreApi<FormState<TValues, TError>>["getInitialState"];
  field: FieldNamespace<TValues, TError>;
  fieldArray: FieldArrayNamespace<TValues, TError>;
  tree: TreeNamespace<TValues, TError>;
  getValues(): TValues;
  reset(nextValues?: Partial<TValues>, options?: DispatchOptions): void;
  handleSubmit(
    onValid: (
      values: TValues,
    ) =>
      | void
      | Record<string, TError>
      | Promise<void | Record<string, TError>>,
    onInvalid?: (errors: Record<string, TError>) => void,
  ): (e?: Event) => void | Promise<void>;
  isSubmitting(): boolean;
  submitCount(): number;
  isSubmitSuccessful(): boolean;
  registerField(path: string, entry: FieldValidatorEntry<TError>): void;
  unregisterField(path: string): void;
  select: FormSelectors<TValues, TError>;
}
