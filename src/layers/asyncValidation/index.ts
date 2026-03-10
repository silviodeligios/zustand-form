import type { Enhancer, Dispatch } from "../../core/types";
import type { FieldRegistry } from "../../validation/registry";
import * as A from "../../core/actions";
import { getIn, hasPath } from "../../utils/paths";
import { treeMatcher } from "../../utils/tree";
import { reindexPathKeyedRecord } from "../../utils/arrayReindex";
import { triggerArrayAsync, runAsync } from "./utils";

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
      case A.ARRAY_APPEND: {
        if (!ctx.path) return draft;
        const pendingBase = draft.pendingFields ?? prev.pendingFields;
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch,
        );
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path) return draft;
        registry.reindex(ctx.path, { type: "remove", index: ctx.index! });
        const pendingBase = reindexPathKeyedRecord(
          draft.pendingFields ?? prev.pendingFields,
          ctx.path,
          { type: "remove", index: ctx.index! },
        );
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch,
        );
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path) return draft;
        registry.reindex(ctx.path, { type: "insert", index: ctx.index! });
        const pendingBase = reindexPathKeyedRecord(
          draft.pendingFields ?? prev.pendingFields,
          ctx.path,
          { type: "insert", index: ctx.index! },
        );
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch,
        );
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path) return draft;
        const op = { type: "move" as const, from: ctx.from!, to: ctx.to! };
        registry.reindex(ctx.path, op);
        const pendingBase = reindexPathKeyedRecord(
          draft.pendingFields ?? prev.pendingFields,
          ctx.path,
          op,
        );
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch,
        );
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path) return draft;
        const op = { type: "swap" as const, from: ctx.from!, to: ctx.to! };
        registry.reindex(ctx.path, op);
        const pendingBase = reindexPathKeyedRecord(
          draft.pendingFields ?? prev.pendingFields,
          ctx.path,
          op,
        );
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch,
        );
      }
      case A.ARRAY_REPLACE: {
        if (!ctx.path) return draft;
        const prefix = ctx.path + ".";
        const all = registry.getAll();
        for (const [p] of all) {
          if (p.startsWith(prefix)) {
            registry.nextVersion(p);
            registry.clearTimer(p);
          }
        }
        let pendingBase = draft.pendingFields ?? prev.pendingFields;
        if (Object.keys(pendingBase).some((k) => k.startsWith(prefix))) {
          const next: Record<string, boolean> = {};
          for (const k of Object.keys(pendingBase)) {
            if (!k.startsWith(prefix) && pendingBase[k] !== undefined)
              next[k] = pendingBase[k];
          }
          pendingBase = next;
        }
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch,
        );
      }
      case A.RESET_FORM:
        return { ...draft, pendingFields: {} };
      case A.RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } =
          draft.pendingFields ?? prev.pendingFields;
        return { ...draft, pendingFields: rest };
      }
      case A.SET_TREE_VALUE: {
        const match = treeMatcher(ctx.path);
        const newValues = draft.values ?? prev.values;
        const all = registry.getAll();
        for (const [path] of all) {
          if (match(path) && !hasPath(newValues, path)) {
            registry.nextVersion(path);
            registry.clearTimer(path);
          }
        }
        const base = draft.pendingFields ?? prev.pendingFields;
        const next: Record<string, boolean> = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            if (base[k] !== undefined) next[k] = base[k];
          } else if (hasPath(newValues, k) && base[k] !== undefined) {
            next[k] = base[k];
          }
        }
        return { ...draft, pendingFields: next };
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
