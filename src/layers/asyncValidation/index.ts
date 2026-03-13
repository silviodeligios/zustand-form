import type { Enhancer, Dispatch } from "../../core/types";
import type { FieldRegistry } from "../../validation/registry";
import * as A from "../../core/actions";
import { hasPath } from "../../utils/paths";
import { treeMatcher } from "../../utils/tree";
import { removeByPrefix, getValueAtKeyPath, keyPathToIndexPath } from "../../utils/arrayKeys";
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const value = getValueAtKeyPath(draft.values ?? prev.values, ctx.path, ak);
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const value = getValueAtKeyPath(draft.values ?? prev.values, ctx.path, ak);
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
        const prevKeys = prev.arrayKeys[ctx.path] ?? [];
        const removedKey = prevKeys[ctx.index!];
        if (removedKey) {
          registry.removeByPrefix(ctx.path + "." + removedKey);
        }
        let pendingBase = draft.pendingFields ?? prev.pendingFields;
        if (removedKey) {
          pendingBase = removeByPrefix(pendingBase, ctx.path + "." + removedKey);
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
      case A.ARRAY_INSERT: {
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
      case A.ARRAY_MOVE:
      case A.ARRAY_SWAP:
      case A.ARRAY_SORT: {
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const all = registry.getAll();
        for (const [path] of all) {
          if (match(path)) {
            const idxPath = keyPathToIndexPath(path, ak);
            if (!hasPath(newValues, idxPath)) {
              registry.nextVersion(path);
              registry.clearTimer(path);
            }
          }
        }
        const base = draft.pendingFields ?? prev.pendingFields;
        const next: Record<string, boolean> = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            if (base[k] !== undefined) next[k] = base[k];
          } else {
            const idxPath = keyPathToIndexPath(k, ak);
            if (hasPath(newValues, idxPath) && base[k] !== undefined) {
              next[k] = base[k];
            }
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let errors = draft.errors ?? prev.errors;
        let pending = draft.pendingFields ?? prev.pendingFields;
        const all = registry.getAll();
        for (const [path, entry] of all) {
          if (!match(path) || !entry.asyncValidate) continue;
          if (errors[path]) continue;
          const value = getValueAtKeyPath(values, path, ak);
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
