import type { Enhancer, Dispatch } from "../core/types";
import type { FieldRegistry } from "../validation/registry";
import type { FieldValidatorEntry } from "../validation/types";
import * as A from "../core/actions";
import { getIn, treeMatcher } from "../core/utils";
import { reindexPathKeyedRecord } from "../core/arrayReindex";

export function asyncValidationEnhancer<TValues, TError = string>(
  registry: FieldRegistry<TError>,
  dispatch: Dispatch,
): Enhancer<TValues, TError> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (!entry?.asyncValidate) return draft;
        // Cancel in-flight async if sync error present (before dirty/mode checks)
        if (draft.errors?.[ctx.path]) {
          registry.nextVersion(ctx.path);
          registry.clearTimer(ctx.path);
          const { [ctx.path]: _, ...rest } =
            draft.pendingFields ?? prev.pendingFields;
          return { ...draft, pendingFields: rest };
        }
        if ((entry.asyncValidateMode ?? "onChange") !== "onChange")
          return draft;
        const dirty = (draft.dirtyFields ?? prev.dirtyFields)[ctx.path];
        if (!dirty) return draft;
        const value = getIn(draft.values ?? prev.values, ctx.path);
        const path = ctx.path;
        const errors = draft.errors ?? prev.errors;
        const { [path]: _, ...clearedErrors } = errors;
        const pending = {
          ...(draft.pendingFields ?? prev.pendingFields),
          [path]: true,
        };
        queueMicrotask(() =>
          runAsync<TError>(path, value, entry, dispatch, registry),
        );
        return { ...draft, errors: clearedErrors, pendingFields: pending };
      }
      case A.BLUR: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (!entry?.asyncValidate) return draft;
        // Cancel in-flight async if sync error present (before dirty/mode checks)
        if (draft.errors?.[ctx.path]) {
          registry.nextVersion(ctx.path);
          registry.clearTimer(ctx.path);
          const { [ctx.path]: _, ...rest } =
            draft.pendingFields ?? prev.pendingFields;
          return { ...draft, pendingFields: rest };
        }
        if (entry.asyncValidateMode !== "onBlur") return draft;
        const dirty = (draft.dirtyFields ?? prev.dirtyFields)[ctx.path];
        if (!dirty) return draft;
        const value = getIn(draft.values ?? prev.values, ctx.path);
        const path = ctx.path;
        const errors = draft.errors ?? prev.errors;
        const { [path]: _, ...clearedErrors } = errors;
        const pending = {
          ...(draft.pendingFields ?? prev.pendingFields),
          [path]: true,
        };
        queueMicrotask(() =>
          runAsync<TError>(path, value, entry, dispatch, registry),
        );
        return { ...draft, errors: clearedErrors, pendingFields: pending };
      }
      case A.ASYNC_RESOLVE: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } =
          draft.pendingFields ?? prev.pendingFields;
        return { ...draft, pendingFields: rest };
      }
      case A.ARRAY_APPEND:
      case A.ARRAY_REMOVE:
      case A.ARRAY_INSERT:
      case A.ARRAY_MOVE:
      case A.ARRAY_SWAP: {
        if (!ctx.path) return draft;
        // Reindex child registrations
        if (ctx.type === A.ARRAY_REMOVE)
          registry.reindex(ctx.path, { type: "remove", index: ctx.index! });
        else if (ctx.type === A.ARRAY_INSERT)
          registry.reindex(ctx.path, { type: "insert", index: ctx.index! });
        else if (ctx.type === A.ARRAY_MOVE)
          registry.reindex(ctx.path, {
            type: "move",
            from: ctx.from!,
            to: ctx.to!,
          });
        else if (ctx.type === A.ARRAY_SWAP)
          registry.reindex(ctx.path, {
            type: "swap",
            from: ctx.from!,
            to: ctx.to!,
          });
        // Reindex pending fields
        let pendingBase = draft.pendingFields ?? prev.pendingFields;
        if (ctx.type === A.ARRAY_REMOVE)
          pendingBase = reindexPathKeyedRecord(pendingBase, ctx.path, {
            type: "remove",
            index: ctx.index!,
          });
        else if (ctx.type === A.ARRAY_INSERT)
          pendingBase = reindexPathKeyedRecord(pendingBase, ctx.path, {
            type: "insert",
            index: ctx.index!,
          });
        else if (ctx.type === A.ARRAY_MOVE)
          pendingBase = reindexPathKeyedRecord(pendingBase, ctx.path, {
            type: "move",
            from: ctx.from!,
            to: ctx.to!,
          });
        else if (ctx.type === A.ARRAY_SWAP)
          pendingBase = reindexPathKeyedRecord(pendingBase, ctx.path, {
            type: "swap",
            from: ctx.from!,
            to: ctx.to!,
          });
        // Trigger async validation on array path itself
        const entry = registry.get(ctx.path);
        if (!entry?.asyncValidate)
          return { ...draft, pendingFields: pendingBase };
        // Cancel if sync error present
        if (draft.errors?.[ctx.path]) {
          registry.nextVersion(ctx.path);
          registry.clearTimer(ctx.path);
          const { [ctx.path]: _, ...rest } = pendingBase;
          return { ...draft, pendingFields: rest };
        }
        if ((entry.asyncValidateMode ?? "onChange") !== "onChange")
          return { ...draft, pendingFields: pendingBase };
        const value = getIn(draft.values ?? prev.values, ctx.path);
        const path = ctx.path;
        const errors = draft.errors ?? prev.errors;
        const { [path]: _, ...clearedErrors } = errors;
        const pending = { ...pendingBase, [path]: true };
        queueMicrotask(() =>
          runAsync<TError>(path, value, entry, dispatch, registry),
        );
        return { ...draft, errors: clearedErrors, pendingFields: pending };
      }
      case A.RESET_FORM:
        return { ...draft, pendingFields: {} };
      case A.RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } =
          draft.pendingFields ?? prev.pendingFields;
        return { ...draft, pendingFields: rest };
      }
      case A.RESET_BRANCH: {
        const match = treeMatcher(ctx.path);
        const all = registry.getAll();
        for (const [path] of all) {
          if (match(path)) {
            registry.nextVersion(path);
            registry.clearTimer(path);
          }
        }
        const base = draft.pendingFields ?? prev.pendingFields;
        const next: Record<string, boolean> = {};
        for (const k of Object.keys(base)) {
          if (!match(k) && base[k] !== undefined) next[k] = base[k];
        }
        return { ...draft, pendingFields: next };
      }
      case A.VALIDATE_BRANCH: {
        const match = treeMatcher(ctx.path);
        const values = draft.values ?? prev.values;
        let errors = draft.errors ?? prev.errors;
        let pending = draft.pendingFields ?? prev.pendingFields;
        const all = registry.getAll();
        for (const [path, entry] of all) {
          if (!match(path) || !entry.asyncValidate) continue;
          if (errors[path]) continue;
          const value = getIn(values, path);
          const { [path]: _, ...clearedErrors } = errors;
          errors = clearedErrors;
          pending = { ...pending, [path]: true };
          queueMicrotask(() =>
            runAsync<TError>(path, value, entry, dispatch, registry),
          );
        }
        return { ...draft, errors, pendingFields: pending };
      }
      default:
        return draft;
    }
  };
}

function runAsync<TError>(
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
