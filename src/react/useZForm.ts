import { useRef, useCallback } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { createForm } from "../core/createForm";
import type { FormState, Form, Enhancer, NamedEnhancer } from "../core/types";
import type { StateCreator } from "zustand/vanilla";
import type { FormResolver, FieldValidateMode } from "../validation/types";
import type { FormHook } from "./types";

export interface UseZFormConfig<TValues> {
  defaultValues: TValues;
  resolver?: FormResolver<TValues>;
  resolverMode?: FieldValidateMode;
  enhancers?: (
    defaults: NamedEnhancer<TValues>[],
  ) => (NamedEnhancer<TValues> | Enhancer<TValues>)[];
  middleware?: (
    initializer: StateCreator<FormState<TValues>>,
  ) => StateCreator<FormState<TValues>>;
}

export function useZForm<TValues>(
  config: UseZFormConfig<TValues>,
): FormHook<TValues> {
  const formRef = useRef<Form<TValues>>();
  if (!formRef.current) {
    const initialState: Partial<FormState<TValues>> = {
      values: config.defaultValues,
    };
    formRef.current = createForm({
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
      selector: (s: FormState<TValues>) => U,
      equalityFn?: (a: U, b: U) => boolean,
    ): U => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useStoreWithEqualityFn(form, selector, equalityFn);
    },
    [form],
  );

  return Object.assign(hook, form) as FormHook<TValues>;
}
