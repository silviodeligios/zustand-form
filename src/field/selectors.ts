import type { FormState, Dispatch } from "../core/types";
import type { FieldState, InputProps, FieldNamespace } from "./types";
import type { Path, PathValue } from "../types/paths";
import * as A from "../core/actions";
import { cached } from "../utils/cache";
import { indexPathToKeyPath, getValueAtKeyPath } from "../utils/arrayKeys";

export function createFieldSelectors<
  TValues,
  TError = string,
>(dispatch: Dispatch): FieldNamespace<TValues, TError>["select"] {
  type Sel<R> = (s: FormState<TValues, TError>) => R;

  const cache = {
    value: new Map<string, Sel<unknown>>(),
    error: new Map<string, Sel<TError | undefined>>(),
    dirty: new Map<string, Sel<boolean>>(),
    touched: new Map<string, Sel<boolean>>(),
    pending: new Map<string, Sel<boolean>>(),
    focused: new Map<string, Sel<boolean>>(),
    fieldState: new Map<string, Sel<FieldState<TError>>>(),
    inputProps: new Map<string, Sel<InputProps>>(),
  };

  /**
   * Create a memoized key-path resolver: only recomputes
   * when `arrayKeys` reference changes.
   */
  function memoKeyPath(path: string) {
    let prevAk: Record<string, string[]> | null = null;
    let prevKp = path;
    return (ak: Record<string, string[]>) => {
      if (ak !== prevAk) {
        prevAk = ak;
        prevKp = indexPathToKeyPath(path, ak);
      }
      return prevKp;
    };
  }

  return {
    value: <P extends Path<TValues>>(path: P) =>
      cached(
        cache.value,
        path,
        () => (s) => getValueAtKeyPath(s.values, path, s.arrayKeys),
      ) as Sel<PathValue<TValues, P>>,
    error: (path: string): Sel<TError | undefined> =>
      cached(cache.error, path, () => {
        const kp = memoKeyPath(path);
        return (s) => s.errors[kp(s.arrayKeys)];
      }),
    dirty: (path: string): Sel<boolean> =>
      cached(cache.dirty, path, () => {
        const kp = memoKeyPath(path);
        return (s) => s.dirtyFields[kp(s.arrayKeys)] ?? false;
      }),
    touched: (path: string): Sel<boolean> =>
      cached(cache.touched, path, () => {
        const kp = memoKeyPath(path);
        return (s) => s.touchedFields[kp(s.arrayKeys)] ?? false;
      }),
    pending: (path: string): Sel<boolean> =>
      cached(cache.pending, path, () => {
        const kp = memoKeyPath(path);
        return (s) => s.pendingFields[kp(s.arrayKeys)] ?? false;
      }),
    focused: (path: string): Sel<boolean> =>
      cached(cache.focused, path, () => {
        const kp = memoKeyPath(path);
        return (s) => s.focusedField === kp(s.arrayKeys);
      }),
    fieldState: (path: string): Sel<FieldState<TError>> =>
      cached(cache.fieldState, path, () => {
        const kp = memoKeyPath(path);
        return (s) => {
          const k = kp(s.arrayKeys);
          return {
            dirty: s.dirtyFields[k] ?? false,
            touched: s.touchedFields[k] ?? false,
            error: s.errors[k],
            pending: s.pendingFields[k] ?? false,
            focused: s.focusedField === k,
          };
        };
      }),
    inputProps: <P extends Path<TValues>>(path: P) =>
      cached(cache.inputProps, path, () => {
        const onChange = (v: unknown) =>
          dispatch({ type: A.SET_VALUE, path, value: v });
        const onBlur = () => dispatch({ type: A.BLUR, path });
        const onFocus = () => dispatch({ type: A.FOCUS, path });
        let prevValues: unknown = null;
        let prevAk: Record<string, string[]> | null = null;
        let prevResult: InputProps | null = null;
        return (s) => {
          if (s.values === prevValues && s.arrayKeys === prevAk)
            return prevResult!;
          prevValues = s.values;
          prevAk = s.arrayKeys;
          prevResult = {
            value: getValueAtKeyPath(s.values, path, s.arrayKeys),
            onChange,
            onBlur,
            onFocus,
          };
          return prevResult;
        };
      }) as Sel<InputProps<PathValue<TValues, P>>>,
  };
}
