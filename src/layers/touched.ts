import type { Enhancer } from "../core/types";
import * as A from "../core/actions";
import { treeMatcher } from "../core/utils";
import { reindexPathKeyedRecord } from "../core/arrayReindex";

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
      case A.ARRAY_APPEND:
      case A.ARRAY_REMOVE:
      case A.ARRAY_INSERT:
      case A.ARRAY_MOVE:
      case A.ARRAY_SWAP: {
        if (!ctx.path) return draft;
        let base = draft.touchedFields ?? prev.touchedFields;
        if (ctx.type === A.ARRAY_REMOVE)
          base = reindexPathKeyedRecord(base, ctx.path, {
            type: "remove",
            index: ctx.index!,
          });
        else if (ctx.type === A.ARRAY_INSERT)
          base = reindexPathKeyedRecord(base, ctx.path, {
            type: "insert",
            index: ctx.index!,
          });
        else if (ctx.type === A.ARRAY_MOVE)
          base = reindexPathKeyedRecord(base, ctx.path, {
            type: "move",
            from: ctx.from!,
            to: ctx.to!,
          });
        else if (ctx.type === A.ARRAY_SWAP)
          base = reindexPathKeyedRecord(base, ctx.path, {
            type: "swap",
            from: ctx.from!,
            to: ctx.to!,
          });
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
