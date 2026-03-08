import type { FormState, Dispatch } from "../core/types";
import type { FieldState, InputProps, FieldNamespace } from "./types";
import type { Path, PathValue } from "../types/paths";
import * as A from "../core/actions";
import { getIn } from "../core/utils";

export function createFieldSelectors<
  TValues,
  TError = string,
>(dispatch: Dispatch): FieldNamespace<TValues, TError>["select"] {
  type Sel<R> = (s: FormState<TValues, TError>) => R;

  function cached<R>(
    map: Map<string, Sel<R>>,
    path: string,
    factory: () => Sel<R>,
  ): Sel<R> {
    let sel = map.get(path);
    if (!sel) {
      sel = factory();
      map.set(path, sel);
    }
    return sel;
  }

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

  return {
    value: <P extends Path<TValues>>(path: P) =>
      cached(cache.value, path, () => (s) => getIn(s.values, path)) as Sel<
        PathValue<TValues, P>
      >,
    error: (path: string): Sel<TError | undefined> =>
      cached(cache.error, path, () => (s) => s.errors[path]),
    dirty: (path: string): Sel<boolean> =>
      cached(cache.dirty, path, () => (s) => s.dirtyFields[path] ?? false),
    touched: (path: string): Sel<boolean> =>
      cached(cache.touched, path, () => (s) => s.touchedFields[path] ?? false),
    pending: (path: string): Sel<boolean> =>
      cached(cache.pending, path, () => (s) => s.pendingFields[path] ?? false),
    focused: (path: string): Sel<boolean> =>
      cached(cache.focused, path, () => (s) => s.focusedField === path),
    fieldState: (path: string): Sel<FieldState<TError>> =>
      cached(cache.fieldState, path, () => (s) => ({
        dirty: s.dirtyFields[path] ?? false,
        touched: s.touchedFields[path] ?? false,
        error: s.errors[path],
        pending: s.pendingFields[path] ?? false,
        focused: s.focusedField === path,
      })),
    inputProps: <P extends Path<TValues>>(path: P) =>
      cached(cache.inputProps, path, () => {
        const onChange = (v: unknown) =>
          dispatch({ type: A.SET_VALUE, path, value: v });
        const onBlur = () => dispatch({ type: A.BLUR, path });
        const onFocus = () => dispatch({ type: A.FOCUS, path });
        return (s) => ({
          value: getIn(s.values, path),
          onChange,
          onBlur,
          onFocus,
        });
      }) as Sel<InputProps<PathValue<TValues, P>>>,
  };
}
