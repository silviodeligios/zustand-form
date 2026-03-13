import { createStore, type StateCreator } from "zustand/vanilla";
import type {
  FormState,
  Form,
  ActionContext,
  NamedEnhancer,
} from "./types";
import type { FormSelectors } from "./selectors";
import * as A from "./actions";
import { createFieldNamespace } from "../field/createField";
import { createFieldArrayNamespace } from "../fieldArray/createFieldArray";
import { createTreeNamespace } from "../tree/createTree";
import type { FormResolver, FieldValidateMode } from "../validation/types";
import { createFieldRegistry } from "../validation/registry";
import { isThenable } from "../utils/compare";
import { valuesEnhancer } from "../layers/values";
import { touchedEnhancer } from "../layers/touched";
import { dirtyEnhancer } from "../layers/dirty";
import { validationEnhancer } from "../layers/validation";
import { schemaValidationEnhancer } from "../layers/schemaValidation";
import { asyncValidationEnhancer } from "../layers/asyncValidation";
import { submitEnhancer } from "../layers/submit";

export interface FormConfig<TValues, TError = string> {
  initialState: Partial<FormState<TValues, TError>>;
  resolver?: FormResolver<TValues, TError> | undefined;
  resolverMode?: FieldValidateMode | undefined;
  enhancers?:
    | ((
        defaults: NamedEnhancer<TValues, TError>[],
      ) => NamedEnhancer<TValues, TError>[])
    | undefined;
  middleware?:
    | ((
        initializer: StateCreator<FormState<TValues, TError>>,
      ) => StateCreator<FormState<TValues, TError>, any, any>)
    | undefined;
}

export function createForm<TValues, TError = string>(
  config: FormConfig<TValues, TError>,
): Form<TValues, TError> {
  const baseInitialState: FormState<TValues, TError> = {
    values: {} as TValues,
    dirtyFields: {},
    touchedFields: {},
    errors: {},
    pendingFields: {},
    focusedField: null,
    isSubmitting: false,
    submitCount: 0,
    isSubmitSuccessful: false,
    ...config.initialState,
  };

  // Preview user enhancers (without defaults) to collect initialState contributions
  // before building defaultEnhancers. This ensures defaultValues is correct for
  // valuesEnhancer and dirtyEnhancer (e.g. reset will use the right values).
  const previewEnhancers = config.enhancers ? config.enhancers([]) : [];
  let initialState = baseInitialState;
  for (const e of previewEnhancers) {
    if (e.initialState) {
      const patch =
        typeof e.initialState === "function"
          ? e.initialState(initialState)
          : e.initialState;
      initialState = { ...initialState, ...patch };
    }
  }

  const defaultValues = initialState.values;

  const initializer: StateCreator<FormState<TValues, TError>> = () =>
    initialState;
  const store = createStore<FormState<TValues, TError>>()(
    config.middleware ? config.middleware(initializer) : initializer,
  );
  const registry = createFieldRegistry<TError>(dispatch);

  const defaultEnhancers: NamedEnhancer<TValues, TError>[] = [
    {
      name: "values",
      enhancer: valuesEnhancer<TValues, TError>(defaultValues),
    },
    { name: "touched", enhancer: touchedEnhancer<TValues, TError>() },
    { name: "dirty", enhancer: dirtyEnhancer<TValues, TError>(defaultValues) },
    {
      name: "validation",
      enhancer: validationEnhancer<TValues, TError>(registry),
    },
    ...(config.resolver
      ? [
          {
            name: "schemaValidation",
            enhancer: schemaValidationEnhancer<TValues, TError>(
              config.resolver,
              config.resolverMode,
            ),
          },
        ]
      : []),
    {
      name: "asyncValidation",
      enhancer: asyncValidationEnhancer<TValues, TError>(registry, dispatch),
    },
    { name: "submit", enhancer: submitEnhancer<TValues, TError>() },
  ];

  const enhancers: NamedEnhancer<TValues, TError>[] = config.enhancers
    ? config.enhancers(defaultEnhancers)
    : defaultEnhancers;

  function dispatch(ctx: ActionContext): void {
    const prev = store.getState();
    let draft: Partial<FormState<TValues, TError>> = {};
    const skip = ctx.options?.disableLayers;
    for (const e of enhancers) {
      if (skip && e.name && skip.includes(e.name)) continue;
      draft = e.enhancer(ctx, prev, draft);
    }
    if (Object.keys(draft).length > 0) {
      const action = ctx.path ? `${ctx.type}:${ctx.path}` : ctx.type;
      // zustand setState accepts 3-arg form for devtools
      (
        store.setState as (
          fn: (s: FormState<TValues, TError>) => FormState<TValues, TError>,
          replace: boolean,
          action: string,
        ) => void
      )((s) => ({ ...s, ...draft }), false, action);
    }
  }

  const select: FormSelectors<TValues, TError> = {
    values: (s) => s.values,
    isSubmitting: (s) => s.isSubmitting,
    submitCount: (s) => s.submitCount,
    isSubmitSuccessful: (s) => s.isSubmitSuccessful,
    focusedField: (s) => s.focusedField,
  };

  return {
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe,
    getInitialState: store.getInitialState,
    field: createFieldNamespace<TValues, TError>(store, dispatch),
    fieldArray: createFieldArrayNamespace<TValues, TError>(store, dispatch),
    tree: createTreeNamespace<TValues, TError>(store, dispatch),
    getValues: () => store.getState().values,
    isSubmitting: () => store.getState().isSubmitting,
    submitCount: () => store.getState().submitCount,
    isSubmitSuccessful: () => store.getState().isSubmitSuccessful,
    reset: (nextValues?, opts?) =>
      dispatch({ type: A.RESET_FORM, value: nextValues, options: opts }),
    handleSubmit: (onValid, onInvalid?) => (e?: Event) => {
      e?.preventDefault();
      dispatch({ type: A.SUBMIT });
      const state = store.getState();
      const errorKeys = Object.keys(state.errors).filter(
        (k) => state.errors[k] !== undefined,
      );
      if (errorKeys.length > 0) {
        dispatch({ type: A.SUBMIT_FAILURE });
        if (onInvalid) {
          const errs: Record<string, TError> = {};
          for (const k of errorKeys) errs[k] = state.errors[k]!;
          onInvalid(errs);
        }
        return;
      }
      const result = onValid(state.values);
      if (isThenable(result)) {
        return result.then(
          () => dispatch({ type: A.SUBMIT_SUCCESS }),
          () => dispatch({ type: A.SUBMIT_FAILURE }),
        );
      } else {
        dispatch({ type: A.SUBMIT_SUCCESS });
      }
    },
    registerField: (path, entry) => registry.register(path, entry),
    unregisterField: (path) => registry.unregister(path),
    select,
  };
}
