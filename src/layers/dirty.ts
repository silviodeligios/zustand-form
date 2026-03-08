import type { Enhancer } from "../core/types";
import * as A from "../core/actions";
import { getIn, isEqual } from "../core/utils";
import { reindexPathKeyedRecord } from "../core/arrayReindex";

export function dirtyEnhancer<TValues, TError = string>(
  defaultValues: TValues,
): Enhancer<TValues, TError> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path) return draft;
        const values = draft.values ?? prev.values;
        const current = getIn(values, ctx.path);
        const initial = getIn(defaultValues, ctx.path);
        const isDirty = !isEqual(current, initial);
        const base = draft.dirtyFields ?? prev.dirtyFields;
        if (isDirty) {
          return { ...draft, dirtyFields: { ...base, [ctx.path]: true } };
        }
        const { [ctx.path]: _, ...rest } = base;
        return { ...draft, dirtyFields: rest };
      }
      case A.SET_DIRTY: {
        if (!ctx.path) return draft;
        const val = ctx.value !== false;
        const base = draft.dirtyFields ?? prev.dirtyFields;
        return { ...draft, dirtyFields: { ...base, [ctx.path]: val } };
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.dirtyFields ?? prev.dirtyFields;
        return {
          ...draft,
          dirtyFields: reindexPathKeyedRecord(base, ctx.path, {
            type: "remove",
            index: ctx.index,
          }),
        };
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.dirtyFields ?? prev.dirtyFields;
        return {
          ...draft,
          dirtyFields: reindexPathKeyedRecord(base, ctx.path, {
            type: "insert",
            index: ctx.index,
          }),
        };
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.dirtyFields ?? prev.dirtyFields;
        return {
          ...draft,
          dirtyFields: reindexPathKeyedRecord(base, ctx.path, {
            type: "move",
            from: ctx.from,
            to: ctx.to,
          }),
        };
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.dirtyFields ?? prev.dirtyFields;
        return {
          ...draft,
          dirtyFields: reindexPathKeyedRecord(base, ctx.path, {
            type: "swap",
            from: ctx.from,
            to: ctx.to,
          }),
        };
      }
      case A.RESET_FORM:
        return { ...draft, dirtyFields: {} };
      case A.RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } =
          draft.dirtyFields ?? prev.dirtyFields;
        return { ...draft, dirtyFields: rest };
      }
      default:
        return draft;
    }
  };
}
