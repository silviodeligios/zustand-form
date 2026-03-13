import { useEffect, useMemo } from "react";
import type { FormHook, UseFieldOptions } from "./types";
import type { Path, PathValue } from "../types/paths";
import { useOptionalFormContext, missingProvider } from "./context";
import { indexPathToKeyPath } from "../utils/arrayKeys";

// Form-explicit overload: path inference works
export function useFieldValidation<
  TValues,
  TError = string,
  P extends Path<TValues> = Path<TValues>,
>(
  form: FormHook<TValues, TError>,
  path: P,
  options?: UseFieldOptions<TError, PathValue<TValues, P>>,
): void;

// Context-based overload: TValues not inferrable, stays unknown
export function useFieldValidation<TError = string>(
  path: string,
  options?: UseFieldOptions<TError>,
): void;

// Implementation
export function useFieldValidation<TValues, TError = string>(
  formOrPath: FormHook<TValues, TError> | string,
  pathOrOptions?: string | UseFieldOptions<TError>,
  maybeOptions?: UseFieldOptions<TError>,
): void {
  const contextForm = useOptionalFormContext<TValues, TError>();
  const form: FormHook<TValues, TError> =
    typeof formOrPath === "string"
      ? (contextForm ?? missingProvider())
      : formOrPath;
  const path: string =
    typeof formOrPath === "string" ? formOrPath : (pathOrOptions as string);
  const options: UseFieldOptions<TError> | undefined =
    typeof formOrPath === "string"
      ? (pathOrOptions as UseFieldOptions<TError> | undefined)
      : maybeOptions;

  // Use key-based path as the stable identity for the effect.
  // When an array is reordered, the index-based path changes (e.g., sections.0.title
  // → sections.2.title) but the key-based path stays the same (sections._k0.title),
  // so the effect doesn't re-run and in-flight async validations are preserved.
  const keyPath = useMemo(
    () => indexPathToKeyPath(path, form.getState().arrayKeys),
    [form, path],
  );

  const validate = options?.validate;
  const validateMode = options?.validateMode;
  const asyncValidate = options?.asyncValidate;
  const asyncValidateMode = options?.asyncValidateMode;
  const debounce = options?.debounce;

  useEffect(() => {
    if (!validate && !asyncValidate) return;
    form.registerField(keyPath, {
      validate,
      validateMode,
      asyncValidate,
      asyncValidateMode,
      debounce,
    });
    return () => form.unregisterField(keyPath);
  }, [
    form,
    keyPath,
    validate,
    validateMode,
    asyncValidate,
    asyncValidateMode,
    debounce,
  ]);
}
