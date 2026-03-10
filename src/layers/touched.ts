import type { Enhancer } from "../core/types";
import * as A from "../core/actions";
import { treeMatcher } from "../utils/tree";
import { hasPath } from "../utils/paths";
import { reindexPathKeyedRecord } from "../utils/arrayReindex";

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
        const base = reindexPathKeyedRecord(
          draft.touchedFields ?? prev.touchedFields,
          ctx.path,
          { type: "remove", index: ctx.index! },
        );
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.touchedFields ?? prev.touchedFields,
          ctx.path,
          { type: "insert", index: ctx.index! },
        );
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.touchedFields ?? prev.touchedFields,
          ctx.path,
          { type: "move", from: ctx.from!, to: ctx.to! },
        );
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.touchedFields ?? prev.touchedFields,
          ctx.path,
          { type: "swap", from: ctx.from!, to: ctx.to! },
        );
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case A.ARRAY_REPLACE: {
        if (!ctx.path) return draft;
        const prefix = ctx.path + ".";
        let base = draft.touchedFields ?? prev.touchedFields;
        if (Object.keys(base).some((k) => k.startsWith(prefix))) {
          const next: Record<string, boolean> = {};
          for (const k of Object.keys(base)) {
            if (!k.startsWith(prefix) && base[k] !== undefined)
              next[k] = base[k];
          }
          base = next;
        }
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
        const next: Record<string, boolean> = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            if (base[k] !== undefined) next[k] = base[k];
          } else if (hasPath(newValues, k) && base[k] !== undefined) {
            next[k] = base[k];
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
