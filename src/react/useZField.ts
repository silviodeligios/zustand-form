import { useEffect, useRef, useCallback, useMemo } from "react";
import type { FormHook, UseZFieldOptions, UseZFieldReturn } from "./types";
import type { Path, PathValue } from "../types/paths";
import { shallow } from "zustand/shallow";
import { useOptionalFormContext, missingProvider } from "./context";
import { useZFieldValidation } from "./useZFieldValidation";

// Form-explicit overload: path inference works
export function useZField<
  TValues,
  TError = string,
  P extends Path<TValues> = Path<TValues>,
>(
  form: FormHook<TValues, TError>,
  path: P,
  options?: UseZFieldOptions<TError, PathValue<TValues, P>>,
): UseZFieldReturn<TError, PathValue<TValues, P>>;

// Context-based overload: TValues not inferrable, stays unknown
export function useZField<TError = string>(
  path: string,
  options?: UseZFieldOptions<TError>,
): UseZFieldReturn<TError>;

// Implementation
export function useZField<TValues, TError = string>(
  formOrPath: FormHook<TValues, TError> | string,
  pathOrOptions?: string | UseZFieldOptions<TError>,
  maybeOptions?: UseZFieldOptions<TError>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): UseZFieldReturn<TError, any> {
  const contextForm = useOptionalFormContext<TValues, TError>();
  const form: FormHook<TValues, TError> =
    typeof formOrPath === "string"
      ? (contextForm ?? missingProvider())
      : formOrPath;
  const path: string =
    typeof formOrPath === "string" ? formOrPath : (pathOrOptions as string);
  const options: UseZFieldOptions<TError> | undefined =
    typeof formOrPath === "string"
      ? (pathOrOptions as UseZFieldOptions<TError> | undefined)
      : maybeOptions;
  useZFieldValidation(form, path as Path<TValues>, options);

  const inputProps = form(form.field.select.inputProps(path), shallow);
  const fieldState = form(form.field.select.fieldState(path), shallow);
  const elRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (fieldState.focused && elRef.current) elRef.current.focus();
  }, [fieldState.focused]);

  const ref = useCallback((el: HTMLElement | null) => {
    elRef.current = el;
  }, []);

  const field = useMemo(
    () => ({ ...inputProps, ref }),
    [inputProps, ref],
  );

  return { field, fieldState };
}
