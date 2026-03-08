import type { Enhancer } from "../core/types";
import type { FieldRegistry } from "../validation/registry";
import * as A from "../core/actions";
import { getIn, treeMatcher } from "../core/utils";
import { reindexPathKeyedRecord } from "../core/arrayReindex";

export function validationEnhancer<TValues>(
  registry: FieldRegistry,
): Enhancer<TValues> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (
          !entry?.validate ||
          (entry.validateMode ?? "onChange") !== "onChange"
        )
          return draft;
        const values = draft.values ?? prev.values;
        const error = entry.validate(getIn(values, ctx.path));
        const base = draft.errors ?? prev.errors;
        return { ...draft, errors: { ...base, [ctx.path]: error } };
      }
      case A.BLUR: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (!entry?.validate || entry.validateMode !== "onBlur") return draft;
        const values = draft.values ?? prev.values;
        const error = entry.validate(getIn(values, ctx.path));
        const base = draft.errors ?? prev.errors;
        return { ...draft, errors: { ...base, [ctx.path]: error } };
      }
      case A.SET_ERROR: {
        if (!ctx.path) return draft;
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: { ...base, [ctx.path]: ctx.value as string },
        };
      }
      case A.CLEAR_ERROR: {
        if (!ctx.path) return draft;
        const base = draft.errors ?? prev.errors;
        const { [ctx.path]: _, ...rest } = base;
        return { ...draft, errors: rest };
      }
      case A.ASYNC_RESOLVE: {
        if (!ctx.path) return draft;
        const pending = draft.pendingFields ?? prev.pendingFields;
        if (!pending[ctx.path]) return draft;
        const base = draft.errors ?? prev.errors;
        if (ctx.value)
          return {
            ...draft,
            errors: { ...base, [ctx.path]: ctx.value as string },
          };
        const { [ctx.path]: _, ...rest } = base;
        return { ...draft, errors: rest };
      }
      case A.CLEAR_ERRORS_BRANCH: {
        const match = treeMatcher(ctx.path);
        const base = draft.errors ?? prev.errors;
        const next: Record<string, string | undefined> = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) next[k] = base[k];
        }
        return { ...draft, errors: next };
      }
      case A.VALIDATE_FIELD: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (!entry?.validate) return draft;
        const values = draft.values ?? prev.values;
        const error = entry.validate(getIn(values, ctx.path));
        const base = draft.errors ?? prev.errors;
        return { ...draft, errors: { ...base, [ctx.path]: error } };
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: reindexPathKeyedRecord(base, ctx.path, {
            type: "remove",
            index: ctx.index,
          }),
        };
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: reindexPathKeyedRecord(base, ctx.path, {
            type: "insert",
            index: ctx.index,
          }),
        };
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: reindexPathKeyedRecord(base, ctx.path, {
            type: "move",
            from: ctx.from,
            to: ctx.to,
          }),
        };
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: reindexPathKeyedRecord(base, ctx.path, {
            type: "swap",
            from: ctx.from,
            to: ctx.to,
          }),
        };
      }
      case A.SUBMIT: {
        let errors = draft.errors ?? prev.errors;
        const values = draft.values ?? prev.values;
        const all = registry.getAll();
        all.forEach((entry, path) => {
          if (!entry.validate) return;
          const error = entry.validate(getIn(values, path));
          if (error) errors = { ...errors, [path]: error };
        });
        return { ...draft, errors };
      }
      case A.RESET_FORM:
        return { ...draft, errors: {} };
      case A.RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } = draft.errors ?? prev.errors;
        return { ...draft, errors: rest };
      }
      default:
        return draft;
    }
  };
}
