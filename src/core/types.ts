import type { StoreApi } from 'zustand/vanilla'
import type * as A from './actions'
import type { FieldApi } from '../path/types'
import type { TreeApi } from '../tree/types'
import type { FormSelectors } from '../selectors'
import type { FieldValidatorEntry } from '../validation/types'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type FormState<TValues> = {
  values: TValues
  dirtyFields: Record<string, boolean>
  touchedFields: Record<string, boolean>
  errors: Record<string, string | undefined>
  pendingFields: Record<string, boolean>
  focusedField: string | null
  isSubmitting: boolean
  submitCount: number
  isSubmitSuccessful: boolean
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export interface DispatchOptions {
  disableLayers?: string[]
}

export type ActionType =
  | typeof A.SET_VALUE | typeof A.SET_ERROR | typeof A.CLEAR_ERROR
  | typeof A.SET_TOUCHED | typeof A.SET_DIRTY | typeof A.FOCUS | typeof A.BLUR
  | typeof A.VALIDATE_FIELD | typeof A.RESET_FIELD
  | typeof A.PENDING_START | typeof A.PENDING_END | typeof A.ASYNC_RESOLVE
  | typeof A.CLEAR_ERRORS_BRANCH | typeof A.RESET_BRANCH | typeof A.VALIDATE_BRANCH
  | typeof A.ARRAY_APPEND | typeof A.ARRAY_REMOVE | typeof A.ARRAY_INSERT | typeof A.ARRAY_MOVE
  | typeof A.RESET_FORM | typeof A.SUBMIT | typeof A.SUBMIT_SUCCESS | typeof A.SUBMIT_FAILURE

export interface ActionContext {
  type: ActionType
  path?: string
  value?: unknown
  index?: number
  from?: number
  to?: number
  options?: DispatchOptions
}

export type Dispatch = (ctx: ActionContext) => void

/** Enhancer: receives context, previous state, accumulated draft; returns enriched draft */
export type Enhancer<TValues> = (
  ctx: ActionContext,
  prev: FormState<TValues>,
  draft: Partial<FormState<TValues>>,
) => Partial<FormState<TValues>>

// ---------------------------------------------------------------------------
// Form (top-level interface)
// ---------------------------------------------------------------------------

export interface Form<TValues> {
  getState: StoreApi<FormState<TValues>>['getState']
  setState: StoreApi<FormState<TValues>>['setState']
  subscribe: StoreApi<FormState<TValues>>['subscribe']
  getInitialState: StoreApi<FormState<TValues>>['getInitialState']
  field(path: string): FieldApi<TValues>
  tree(path?: string): TreeApi<TValues>
  getValues(): TValues
  reset(nextValues?: Partial<TValues>, options?: DispatchOptions): void
  handleSubmit(
    onValid: (values: TValues) => void | Promise<void>,
    onInvalid?: (errors: Record<string, string>) => void,
  ): (e?: Event) => void
  isSubmitting(): boolean
  submitCount(): number
  isSubmitSuccessful(): boolean
  registerField(path: string, entry: FieldValidatorEntry): void
  unregisterField(path: string): void
  select: FormSelectors<TValues>
}
