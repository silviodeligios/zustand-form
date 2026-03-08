import { useEffect, useRef, useCallback, useMemo } from "react";
import type { FormHook, UseZFieldOptions, UseZFieldReturn } from "./types";
import { shallow } from "zustand/shallow";
import { useOptionalFormContext, missingProvider } from "./context";

export function useZField<TValues, TError = string>(
  form: FormHook<TValues, TError>,
  path: string,
  options?: UseZFieldOptions<TError>,
): UseZFieldReturn<TError>;
export function useZField<TError = string>(
  path: string,
  options?: UseZFieldOptions<TError>,
): UseZFieldReturn<TError>;
export function useZField<TValues, TError = string>(
  formOrPath: FormHook<TValues, TError> | string,
  pathOrOptions?: string | UseZFieldOptions<TError>,
  maybeOptions?: UseZFieldOptions<TError>,
): UseZFieldReturn<TError> {
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
  const validate = options?.validate;
  const validateMode = options?.validateMode;
  const asyncValidate = options?.asyncValidate;
  const asyncValidateMode = options?.asyncValidateMode;
  const debounce = options?.debounce;

  useEffect(() => {
    if (!validate && !asyncValidate) return;
    form.registerField(path, {
      validate,
      validateMode,
      asyncValidate,
      asyncValidateMode,
      debounce,
    });
    return () => form.unregisterField(path);
  }, [
    form,
    path,
    validate,
    validateMode,
    asyncValidate,
    asyncValidateMode,
    debounce,
  ]);

  const fieldState = form(form.field.select.fieldState(path), shallow);
  const elRef = useRef<HTMLElement | null>(null);
  const focused = form(form.field.select.focused(path));

  useEffect(() => {
    if (focused && elRef.current) elRef.current.focus();
  }, [focused]);

  const onChange = useCallback(
    (v: unknown) => form.field.setValue(path, v),
    [form, path],
  );
  const onBlur = useCallback(() => form.field.blur(path), [form, path]);
  const onFocus = useCallback(() => form.field.focus(path), [form, path]);
  const ref = useCallback((el: HTMLElement | null) => {
    elRef.current = el;
  }, []);

  const field = useMemo(
    () => ({
      value: fieldState.value,
      onChange,
      onBlur,
      onFocus,
      ref,
    }),
    [fieldState.value, onChange, onBlur, onFocus, ref],
  );

  return { field, fieldState };
}
