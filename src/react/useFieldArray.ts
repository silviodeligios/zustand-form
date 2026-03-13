import { useMemo } from "react";
import type {
  FormHook,
  UseFieldOptions,
  UseFieldArrayReturn,
} from "./types";
import { shallow } from "zustand/shallow";
import type { Path, PathValue, ArrayElement } from "../types/paths";
import type { DispatchOptions } from "../core/types";
import { useOptionalFormContext, missingProvider } from "./context";
import { useFieldValidation } from "./useFieldValidation";

// Form-explicit overload: element type inferred from path
export function useFieldArray<
  TValues,
  TError = string,
  P extends Path<TValues> = Path<TValues>,
>(
  form: FormHook<TValues, TError>,
  path: P,
  options?: UseFieldOptions<TError, PathValue<TValues, P>>,
): UseFieldArrayReturn<TError, ArrayElement<PathValue<TValues, P>>>;

// Context-based overload: element type unknown
export function useFieldArray(
  path: string,
  options?: UseFieldOptions,
): UseFieldArrayReturn;

// Implementation
export function useFieldArray<TValues, TError = string>(
  formOrPath: FormHook<TValues, TError> | string,
  pathOrOptions?: string | UseFieldOptions<TError>,
  maybeOptions?: UseFieldOptions<TError>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): UseFieldArrayReturn<any, any> {
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
  useFieldValidation(form, path as Path<TValues>, options);

  const fieldState = form(form.field.select.fieldState(path), shallow);
  const keys = form(form.fieldArray.select.keys(path), shallow);

  const fields = useMemo(
    () => keys.map((id, index) => ({ id, index })),
    [keys],
  );

  // All callbacks bind `path` to fieldArray methods — memoize as a single object
  const actions = useMemo(() => {
    const fa = form.fieldArray;
    return {
      append: (value: unknown, opts?: DispatchOptions) => fa.append(path, value, opts),
      prepend: (value: unknown, opts?: DispatchOptions) => fa.prepend(path, value, opts),
      remove: (index: number, opts?: DispatchOptions) => fa.remove(path, index, opts),
      insert: (index: number, value: unknown, opts?: DispatchOptions) => fa.insert(path, index, value, opts),
      move: (from: number, to: number, opts?: DispatchOptions) => fa.move(path, from, to, opts),
      swap: (a: number, b: number, opts?: DispatchOptions) => fa.swap(path, a, b, opts),
      replace: (arr: unknown[], opts?: DispatchOptions) => fa.replace(path, arr, opts),
      sort: (comparator: (a: unknown, b: unknown) => number, opts?: DispatchOptions) => fa.sort(path, comparator, opts),
      reorder: (permutation: number[], opts?: DispatchOptions) => fa.reorder(path, permutation, opts),
    };
  }, [form.fieldArray, path]);

  return { fields, fieldState, ...actions };
}
