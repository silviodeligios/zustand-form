import type { Enhancer } from "../core/types";
import * as A from "../core/actions";
import { reindexPathKeyedRecord } from "../core/arrayReindex";

export function pendingEnhancer<TValues>(): Enhancer<TValues> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.PENDING_START: {
        if (!ctx.path) return draft;
        const base = draft.pendingFields ?? prev.pendingFields;
        return { ...draft, pendingFields: { ...base, [ctx.path]: true } };
      }
      case A.PENDING_END:
      case A.ASYNC_RESOLVE: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } =
          draft.pendingFields ?? prev.pendingFields;
        return { ...draft, pendingFields: rest };
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.pendingFields ?? prev.pendingFields;
        return {
          ...draft,
          pendingFields: reindexPathKeyedRecord(base, ctx.path, {
            type: "remove",
            index: ctx.index,
          }),
        };
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.pendingFields ?? prev.pendingFields;
        return {
          ...draft,
          pendingFields: reindexPathKeyedRecord(base, ctx.path, {
            type: "insert",
            index: ctx.index,
          }),
        };
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.pendingFields ?? prev.pendingFields;
        return {
          ...draft,
          pendingFields: reindexPathKeyedRecord(base, ctx.path, {
            type: "move",
            from: ctx.from,
            to: ctx.to,
          }),
        };
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.pendingFields ?? prev.pendingFields;
        return {
          ...draft,
          pendingFields: reindexPathKeyedRecord(base, ctx.path, {
            type: "swap",
            from: ctx.from,
            to: ctx.to,
          }),
        };
      }
      case A.RESET_FORM:
        return { ...draft, pendingFields: {} };
      case A.RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } =
          draft.pendingFields ?? prev.pendingFields;
        return { ...draft, pendingFields: rest };
      }
      default:
        return draft;
    }
  };
}
