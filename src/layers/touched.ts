import type { Enhancer } from "../core/types";
import * as A from "../core/actions";
import { treeMatcher } from "../utils/tree";
import { hasPath } from "../utils/paths";
import { removeByPrefix, keyPathToIndexPath } from "../utils/arrayKeys";

export function touchedEnhancer<TValues, TError = string>(): Enhancer<
  TValues,
  TError
> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.FOCUS: {
        if (!ctx.path) return { ...draft, focusedField: null };
        const touched = {
          ...(draft.touchedFields ?? prev.touchedFields),
          [ctx.path]: true,
        };
        return { ...draft, touchedFields: touched, focusedField: ctx.path };
      }
      case A.BLUR: {
        if (!ctx.path) return draft;
        const focus =
          prev.focusedField === ctx.path
            ? null
            : (draft.focusedField ?? prev.focusedField);
        return { ...draft, focusedField: focus };
      }
      case A.SET_TOUCHED: {
        if (!ctx.path) return draft;
        const val = ctx.value !== false;
        const touched = {
          ...(draft.touchedFields ?? prev.touchedFields),
          [ctx.path]: val,
        };
        return { ...draft, touchedFields: touched };
      }
      case A.ARRAY_APPEND: {
        if (!ctx.path) return draft;
        const base = draft.touchedFields ?? prev.touchedFields;
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path) return draft;
        const prevKeys = prev.arrayKeys[ctx.path] ?? [];
        const removedKey = prevKeys[ctx.index!];
        let base = draft.touchedFields ?? prev.touchedFields;
        if (removedKey) {
          base = removeByPrefix(base, ctx.path + "." + removedKey);
        }
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path) return draft;
        const base = draft.touchedFields ?? prev.touchedFields;
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case A.ARRAY_MOVE:
      case A.ARRAY_SWAP:
      case A.ARRAY_SORT: {
        if (!ctx.path) return draft;
        const base = draft.touchedFields ?? prev.touchedFields;
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case A.RESET_FORM:
        return { ...draft, touchedFields: {}, focusedField: null };
      case A.RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } =
          draft.touchedFields ?? prev.touchedFields;
        return { ...draft, touchedFields: rest };
      }
      case A.SET_TREE_VALUE: {
        const match = treeMatcher(ctx.path);
        const base = draft.touchedFields ?? prev.touchedFields;
        const newValues = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
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
        return { ...draft, touchedFields: next };
      }
      case A.RESET_BRANCH: {
        const match = treeMatcher(ctx.path);
        const base = draft.touchedFields ?? prev.touchedFields;
        const next: Record<string, boolean> = {};
        for (const k of Object.keys(base)) {
          if (!match(k) && base[k] !== undefined) next[k] = base[k];
        }
        return { ...draft, touchedFields: next };
      }
      default:
        return draft;
    }
  };
}
