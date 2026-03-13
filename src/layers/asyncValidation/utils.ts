import type { Dispatch } from "../../core/types";
import type { FieldRegistry } from "../../validation/registry";
import type { FieldValidatorEntry } from "../../validation/types";
import type { FormState } from "../../core/types";
import * as A from "../../core/actions";
import { getValueAtKeyPath } from "../../utils/arrayKeys";

export function triggerArrayAsync<TValues, TError>(
  pendingBase: Record<string, boolean>,
  draft: Partial<FormState<TValues, TError>>,
  prev: FormState<TValues, TError>,
  path: string,
  registry: FieldRegistry<TError>,
  dispatch: Dispatch,
): Partial<FormState<TValues, TError>> {
  const entry = registry.get(path);
  if (!entry?.asyncValidate) return { ...draft, pendingFields: pendingBase };
  if (draft.errors?.[path]) {
    registry.nextVersion(path);
    registry.clearTimer(path);
    const { [path]: _, ...rest } = pendingBase;
    return { ...draft, pendingFields: rest };
  }
  if ((entry.asyncValidateMode ?? "onChange") !== "onChange")
    return { ...draft, pendingFields: pendingBase };
  const ak = draft.arrayKeys ?? prev.arrayKeys;
  const value = getValueAtKeyPath(draft.values ?? prev.values, path, ak);
  const errors = draft.errors ?? prev.errors;
  const { [path]: _, ...clearedErrors } = errors;
  const pending = { ...pendingBase, [path]: true };
  queueMicrotask(() =>
    runAsync<TError>(path, value, entry, dispatch, registry),
  );
  return { ...draft, errors: clearedErrors, pendingFields: pending };
}

export function runAsync<TError>(
  path: string,
  value: unknown,
  entry: FieldValidatorEntry<TError>,
  dispatch: Dispatch,
  registry: FieldRegistry<TError>,
): void {
  if (entry.debounce && entry.debounce > 0) {
    registry.nextVersion(path);
    registry.setTimer(
      path,
      setTimeout(() => {
        const version = registry.nextVersion(path);
        void entry.asyncValidate!(value).then((error) => {
          if (registry.getVersion(path) !== version) return;
          dispatch({ type: A.ASYNC_RESOLVE, path, value: error });
        });
      }, entry.debounce),
    );
  } else {
    const version = registry.nextVersion(path);
    void entry.asyncValidate!(value).then((error) => {
      if (registry.getVersion(path) !== version) return;
      dispatch({ type: A.ASYNC_RESOLVE, path, value: error });
    });
  }
}
