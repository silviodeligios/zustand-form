import { useMemo, useCallback, useRef, useState } from "react";
import type { FormHook, UseZFieldArrayReturn } from "./types";
import type { DispatchOptions } from "../core/types";
import { useOptionalFormContext, missingProvider } from "./context";

let keyCounter = 0;
function generateKey(): string {
  return "_k" + String(keyCounter++);
}

export function useZFieldArray<TValues>(
  form: FormHook<TValues>,
  path: string,
): UseZFieldArrayReturn;
export function useZFieldArray(path: string): UseZFieldArrayReturn;
export function useZFieldArray<TValues>(
  formOrPath: FormHook<TValues> | string,
  maybePath?: string,
): UseZFieldArrayReturn {
  const contextForm = useOptionalFormContext<TValues>();
  const form: FormHook<TValues> =
    typeof formOrPath === "string"
      ? (contextForm ?? missingProvider())
      : formOrPath;
  const path: string = typeof formOrPath === "string" ? formOrPath : maybePath!;
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

  const setValue = useCallback(
    (arr: unknown[], opts?: DispatchOptions) => {
      keysRef.current = arr.map(() => generateKey());
      fa.setValue(path, arr, opts);
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

  return { fields, append, prepend, remove, insert, move, swap, setValue };
}
