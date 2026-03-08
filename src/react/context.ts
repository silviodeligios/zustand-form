import { createContext, useContext } from "react";
import type { FormHook } from "./types";

const FormContext = createContext<FormHook<any> | null>(null);

export const FormProvider = FormContext.Provider;

export function useFormContext<TValues>(): FormHook<TValues> {
  const form = useContext(FormContext);
  if (!form) throw new Error("useFormContext must be used within FormProvider");
  return form as FormHook<TValues>;
}

export function useOptionalFormContext<TValues>(): FormHook<TValues> | null {
  return useContext(FormContext) as FormHook<TValues> | null;
}

export function missingProvider(): never {
  throw new Error("useFormContext must be used within FormProvider");
}
