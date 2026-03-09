import type { FormHook } from "./types";
import type { Path, PathValue } from "../types/paths";
import { useOptionalFormContext, missingProvider } from "./context";

// Form-explicit overload: path inference works
export function useWatch<
  TValues,
  TError = string,
  P extends Path<TValues> = Path<TValues>,
>(form: FormHook<TValues, TError>, path: P): PathValue<TValues, P>;

// Context-based overload
export function useWatch(path: string): unknown;

// Implementation
export function useWatch<TValues, TError = string>(
  formOrPath: FormHook<TValues, TError> | string,
  maybePath?: string,
): unknown {
  const contextForm = useOptionalFormContext<TValues, TError>();
  const form: FormHook<TValues, TError> =
    typeof formOrPath === "string"
      ? (contextForm ?? missingProvider())
      : formOrPath;
  const path: string =
    typeof formOrPath === "string" ? formOrPath : (maybePath as string);

  return form(form.field.select.value(path as Path<TValues>));
}
