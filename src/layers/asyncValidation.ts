import type { Enhancer, Dispatch } from "../core/types";
import type { FieldRegistry } from "../validation/registry";
import type { FieldValidatorEntry } from "../validation/types";
import * as A from "../core/actions";
import { getIn } from "../core/utils";

export function asyncValidationEnhancer<TValues>(
  registry: FieldRegistry,
  dispatch: Dispatch,
): Enhancer<TValues> {
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
        queueMicrotask(() => runAsync(path, value, entry, dispatch, registry));
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
        queueMicrotask(() => runAsync(path, value, entry, dispatch, registry));
        return { ...draft, errors: clearedErrors, pendingFields: pending };
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path || ctx.index == null) return draft;
        registry.reindex(ctx.path, { type: "remove", index: ctx.index });
        return draft;
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path || ctx.index == null) return draft;
        registry.reindex(ctx.path, { type: "insert", index: ctx.index });
        return draft;
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        registry.reindex(ctx.path, {
          type: "move",
          from: ctx.from,
          to: ctx.to,
        });
        return draft;
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        registry.reindex(ctx.path, {
          type: "swap",
          from: ctx.from,
          to: ctx.to,
        });
        return draft;
      }
      default:
        return draft;
    }
  };
}

function runAsync(
  path: string,
  value: unknown,
  entry: FieldValidatorEntry,
  dispatch: Dispatch,
  registry: FieldRegistry,
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
