import { createStore } from 'zustand/vanilla'
import { devtools } from 'zustand/middleware'
import type { FormState, Form, ActionContext, Enhancer } from './types'
import type { FormSelectors } from '../selectors'
import * as A from './actions'
import { createFieldApi } from '../path/createPathApi'
import { createTreeApi } from '../tree/createTreeApi'
import type { FormResolver, FieldValidateMode } from '../validation/types'
import { createFieldRegistry } from '../validation/registry'
import { valuesEnhancer } from '../layers/values'
import { touchedEnhancer } from '../layers/touched'
import { dirtyEnhancer } from '../layers/dirty'
import { validationEnhancer } from '../layers/validation'
import { pendingEnhancer } from '../layers/pending'
import { schemaValidationEnhancer } from '../layers/schemaValidation'
import { asyncValidationEnhancer } from '../layers/asyncValidation'
import { submitEnhancer } from '../layers/submit'

export interface FormConfig<TValues> {
  defaultValues: TValues
  resolver?: FormResolver<TValues>
  resolverMode?: FieldValidateMode
}

export function createForm<TValues>(config: FormConfig<TValues>): Form<TValues> {
  const initialState: FormState<TValues> = {
    values: config.defaultValues, dirtyFields: {}, touchedFields: {},
    errors: {}, pendingFields: {}, focusedField: null,
    isSubmitting: false, submitCount: 0, isSubmitSuccessful: false,
  }

  const store = createStore<FormState<TValues>>()(devtools(() => initialState, { name: 'zForm' }))
  const registry = createFieldRegistry(dispatch)

  const enhancers: Enhancer<TValues>[] = [
    valuesEnhancer(config.defaultValues),
    touchedEnhancer(),
    dirtyEnhancer(config.defaultValues),
    validationEnhancer(registry),
    ...(config.resolver ? [schemaValidationEnhancer<TValues>(config.resolver, config.resolverMode)] : []),
    asyncValidationEnhancer(registry, dispatch),
    pendingEnhancer(),
    submitEnhancer(),
  ]

  function dispatch(ctx: ActionContext): void {
    const prev = store.getState()
    let draft: Partial<FormState<TValues>> = {}
    for (const e of enhancers) draft = e(ctx, prev, draft)
    if (Object.keys(draft).length > 0) {
      const action = ctx.path ? `${ctx.type}:${ctx.path}` : ctx.type
      store.setState((s) => ({ ...s, ...draft }), false, action)
    }
  }

  const select: FormSelectors<TValues> = {
    values: (s) => s.values, isSubmitting: (s) => s.isSubmitting,
    submitCount: (s) => s.submitCount, isSubmitSuccessful: (s) => s.isSubmitSuccessful,
    focusedField: (s) => s.focusedField,
  }

  return {
    getState: store.getState, setState: store.setState,
    subscribe: store.subscribe, getInitialState: store.getInitialState,
    field: (p) => createFieldApi(store, dispatch, p),
    tree: (p?) => createTreeApi(store, dispatch, p),
    getValues: () => store.getState().values,
    isSubmitting: () => store.getState().isSubmitting,
    submitCount: () => store.getState().submitCount,
    isSubmitSuccessful: () => store.getState().isSubmitSuccessful,
    reset: (nextValues?, opts?) => dispatch({ type: A.RESET_FORM, value: nextValues, options: opts }),
    handleSubmit: (onValid, onInvalid?) => (e?: Event) => {
      e?.preventDefault?.()
      dispatch({ type: A.SUBMIT })
      const state = store.getState()
      const errorKeys = Object.keys(state.errors).filter(k => state.errors[k] !== undefined)
      if (errorKeys.length > 0) {
        dispatch({ type: A.SUBMIT_FAILURE })
        if (onInvalid) {
          const errs: Record<string, string> = {}
          for (const k of errorKeys) errs[k] = state.errors[k]!
          onInvalid(errs)
        }
        return
      }
      const result = onValid(state.values)
      if (result && typeof (result as Promise<void>).then === 'function') {
        (result as Promise<void>).then(
          () => dispatch({ type: A.SUBMIT_SUCCESS }),
          () => dispatch({ type: A.SUBMIT_FAILURE }),
        )
      } else {
        dispatch({ type: A.SUBMIT_SUCCESS })
      }
    },
    registerField: (path, entry) => registry.register(path, entry),
    unregisterField: (path) => registry.unregister(path),
    select,
  }
}
