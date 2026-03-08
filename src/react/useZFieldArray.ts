import { useMemo, useCallback, useRef, useState } from "react";
import type {
  FormHook,
  UseZFieldOptions,
  UseZFieldArrayReturn,
  FieldArrayState,
} from "./types";
import type { Path, PathValue, ArrayElement } from "../types/paths";
import type { DispatchOptions } from "../core/types";
import { useOptionalFormContext, missingProvider } from "./context";
import { useZFieldValidation } from "./useZFieldValidation";

let keyCounter = 0;
function generateKey(): string {
  return "_k" + String(keyCounter++);
}

// Form-explicit overload: element type inferred from path
export function useZFieldArray<
  TValues,
  TError = string,
  P extends Path<TValues> = Path<TValues>,
>(
  form: FormHook<TValues, TError>,
  path: P,
  options?: UseZFieldOptions<TError, PathValue<TValues, P>>,
): UseZFieldArrayReturn<TError, ArrayElement<PathValue<TValues, P>>>;

// Context-based overload: element type unknown
export function useZFieldArray(
  path: string,
  options?: UseZFieldOptions,
): UseZFieldArrayReturn;

// Implementation
export function useZFieldArray<TValues, TError = string>(
  formOrPath: FormHook<TValues, TError> | string,
  pathOrOptions?: string | UseZFieldOptions<TError>,
  maybeOptions?: UseZFieldOptions<TError>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): UseZFieldArrayReturn<any, any> {
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

  const error = form(form.field.select.error(path));
  const dirty = form(form.field.select.dirty(path));
  const touched = form(form.field.select.touched(path));
  const pending = form(form.field.select.pending(path));
  const fieldState: FieldArrayState<TError> = useMemo(
    () => ({ error, dirty, touched, pending }),
    [error, dirty, touched, pending],
  );

  const length = form(form.fieldArray.select.length(path));
  const [version, setVersion] = useState(0);
  const keysRef = useRef<string[]>([]);

  // Reconcile keys when length changes externally
  if (keysRef.current.length !== length) {
    const prev = keysRef.current;
    if (length > prev.length) {
      keysRef.current = [
        ...prev,
        ...Array.from({ length: length - prev.length }, generateKey),
      ];
    } else {
      keysRef.current = prev.slice(0, length);
    }
  }

  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const fa = form.fieldArray;

  const append = useCallback(
    (value: unknown, opts?: DispatchOptions) => {
      keysRef.current = [...keysRef.current, generateKey()];
      fa.append(path, value, opts);
    },
    [fa, path],
  );

  const prepend = useCallback(
    (value: unknown, opts?: DispatchOptions) => {
      keysRef.current = [generateKey(), ...keysRef.current];
      fa.prepend(path, value, opts);
    },
    [fa, path],
  );

  const remove = useCallback(
    (index: number, opts?: DispatchOptions) => {
      keysRef.current = keysRef.current.filter((_, i) => i !== index);
      fa.remove(path, index, opts);
    },
    [fa, path],
  );

  const insert = useCallback(
    (index: number, value: unknown, opts?: DispatchOptions) => {
      const next = [...keysRef.current];
      next.splice(index, 0, generateKey());
      keysRef.current = next;
      fa.insert(path, index, value, opts);
    },
    [fa, path],
  );

  const move = useCallback(
    (from: number, to: number, opts?: DispatchOptions) => {
      const next = [...keysRef.current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      keysRef.current = next;
      fa.move(path, from, to, opts);
      bump();
    },
    [fa, path, bump],
  );

  const swap = useCallback(
    (indexA: number, indexB: number, opts?: DispatchOptions) => {
      const next = [...keysRef.current];
      const tmp = next[indexA]!;
      next[indexA] = next[indexB]!;
      next[indexB] = tmp;
      keysRef.current = next;
      fa.swap(path, indexA, indexB, opts);
      bump();
    },
    [fa, path, bump],
  );

  const replace = useCallback(
    (arr: unknown[], opts?: DispatchOptions) => {
      keysRef.current = arr.map(() => generateKey());
      fa.replace(path, arr, opts);
      bump();
    },
    [fa, path, bump],
  );

  const fields = useMemo(
    () => keysRef.current.map((id, index) => ({ id, index })),
    // version and length are intentional triggers — keysRef is mutated before these change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, length],
  );

  return {
    fields,
    fieldState,
    append,
    prepend,
    remove,
    insert,
    move,
    swap,
    replace,
  };
}
