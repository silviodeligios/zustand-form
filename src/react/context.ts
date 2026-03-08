import { createContext, useContext } from "react";
import type { FormHook } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FormContext = createContext<FormHook<any, any> | null>(null);

export const FormProvider = FormContext.Provider;

export function useFormContext<TValues, TError = string>(): FormHook<
  TValues,
  TError
> {
  const form = useContext(FormContext);
  if (!form) throw new Error("useFormContext must be used within FormProvider");
  return form as FormHook<TValues, TError>;
}

export function useOptionalFormContext<TValues, TError = string>(): FormHook<
  TValues,
  TError
> | null {
  return useContext(FormContext) as FormHook<TValues, TError> | null;
}

export function missingProvider(): never {
  throw new Error("useFormContext must be used within FormProvider");
}
