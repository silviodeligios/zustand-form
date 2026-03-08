import { useRef, useCallback } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { createForm } from "../core/createForm";
import type { FormState, Form, Enhancer, NamedEnhancer } from "../core/types";
import type { StateCreator } from "zustand/vanilla";
import type { FormResolver, FieldValidateMode } from "../validation/types";
import type { FormHook } from "./types";

export interface UseZFormConfig<TValues, TError = string> {
  defaultValues: TValues;
  resolver?: FormResolver<TValues, TError>;
  resolverMode?: FieldValidateMode;
  enhancers?: (
    defaults: NamedEnhancer<TValues, TError>[],
  ) => (NamedEnhancer<TValues, TError> | Enhancer<TValues, TError>)[];
  middleware?: (
    initializer: StateCreator<FormState<TValues, TError>>,
  ) => StateCreator<FormState<TValues, TError>, any, any>;
}

export function useZForm<TValues, TError = string>(
  config: UseZFormConfig<TValues, TError>,
): FormHook<TValues, TError> {
  const formRef = useRef<Form<TValues, TError>>();
  if (!formRef.current) {
    const initialState: Partial<FormState<TValues, TError>> = {
      values: config.defaultValues,
    };
    formRef.current = createForm<TValues, TError>({
      initialState,
      resolver: config.resolver,
      resolverMode: config.resolverMode,
      enhancers: config.enhancers,
      middleware: config.middleware,
    });
  }
  const form = formRef.current;

  const hook = useCallback(
    <U>(
      selector: (s: FormState<TValues, TError>) => U,
      equalityFn?: (a: U, b: U) => boolean,
    ): U => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useStoreWithEqualityFn(form, selector, equalityFn);
    },
    [form],
  );

  return Object.assign(hook, form) as FormHook<TValues, TError>;
}
