import type { Dispatch, FormState } from "../../core/types";
import type { FieldRegistry } from "../../validation/registry";
import type { FieldValidatorEntry } from "../../validation/types";
import * as A from "../../core/actions";
import { getIn } from "../../core/utils";

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
  const value = getIn(draft.values ?? prev.values, path);
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
    // Create session immediately so reindex can update its path during debounce wait
    const sessionId = registry.createSession(path, 0);
    registry.nextVersion(path); // invalidate any previous debounce
    registry.setTimer(
      path,
      setTimeout(() => {
        const session = registry.getSession(sessionId);
        if (!session) return;
        const currentPath = session.path;
        const version = registry.nextVersion(currentPath);
        session.version = version;
        void entry.asyncValidate!(value).then((error) => {
          const s = registry.getSession(sessionId);
          if (!s) return;
          if (registry.getVersion(s.path) !== s.version) return;
          dispatch({ type: A.ASYNC_RESOLVE, path: s.path, value: error });
          registry.deleteSession(sessionId);
        });
      }, entry.debounce),
    );
  } else {
    const version = registry.nextVersion(path);
    const sessionId = registry.createSession(path, version);
    void entry.asyncValidate!(value).then((error) => {
      const session = registry.getSession(sessionId);
      if (!session) return;
      if (registry.getVersion(session.path) !== session.version) return;
      dispatch({ type: A.ASYNC_RESOLVE, path: session.path, value: error });
      registry.deleteSession(sessionId);
    });
  }
}
