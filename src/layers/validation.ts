import type { Enhancer, FormState } from "../core/types";
import type { FieldRegistry } from "../validation/registry";
import * as A from "../core/actions";
import { getIn, hasPath } from "../utils/paths";
import { treeMatcher } from "../utils/tree";
import { reindexPathKeyedRecord } from "../utils/arrayReindex";

function validateArrayPath<TValues, TError>(
  errors: Record<string, TError | undefined>,
  draft: Partial<FormState<TValues, TError>>,
  prev: FormState<TValues, TError>,
  path: string,
  registry: FieldRegistry<TError>,
): Partial<FormState<TValues, TError>> {
  const entry = registry.get(path);
  if (entry?.validate && (entry.validateMode ?? "onChange") === "onChange") {
    const values = draft.values ?? prev.values;
    const error = entry.validate(getIn(values, path));
    return { ...draft, errors: { ...errors, [path]: error } };
  }
  return { ...draft, errors };
}

export function validationEnhancer<TValues, TError = string>(
  registry: FieldRegistry<TError>,
): Enhancer<TValues, TError> {
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
          errors: { ...base, [ctx.path]: ctx.value as TError },
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
            errors: { ...base, [ctx.path]: ctx.value as TError },
          };
        const { [ctx.path]: _, ...rest } = base;
        return { ...draft, errors: rest };
      }
      case A.CLEAR_ERRORS_BRANCH: {
        const match = treeMatcher(ctx.path);
        const base = draft.errors ?? prev.errors;
        const next: Record<string, TError | undefined> = {};
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
      case A.ARRAY_APPEND: {
        if (!ctx.path) return draft;
        return validateArrayPath(
          draft.errors ?? prev.errors,
          draft,
          prev,
          ctx.path,
          registry,
        );
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path) return draft;
        const errors = reindexPathKeyedRecord(
          draft.errors ?? prev.errors,
          ctx.path,
          { type: "remove", index: ctx.index! },
        );
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path) return draft;
        const errors = reindexPathKeyedRecord(
          draft.errors ?? prev.errors,
          ctx.path,
          { type: "insert", index: ctx.index! },
        );
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path) return draft;
        const errors = reindexPathKeyedRecord(
          draft.errors ?? prev.errors,
          ctx.path,
          { type: "move", from: ctx.from!, to: ctx.to! },
        );
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path) return draft;
        const errors = reindexPathKeyedRecord(
          draft.errors ?? prev.errors,
          ctx.path,
          { type: "swap", from: ctx.from!, to: ctx.to! },
        );
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case A.ARRAY_REPLACE: {
        if (!ctx.path) return draft;
        const prefix = ctx.path + ".";
        let errors = draft.errors ?? prev.errors;
        if (Object.keys(errors).some((k) => k.startsWith(prefix))) {
          const next: Record<string, TError | undefined> = {};
          for (const k of Object.keys(errors)) {
            if (!k.startsWith(prefix)) next[k] = errors[k];
          }
          errors = next;
        }
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case A.SUBMIT: {
        let errors = draft.errors ?? prev.errors;
        const values = draft.values ?? prev.values;
        const all = registry.getAll();
        all.forEach((entry, path) => {
          const error = entry.validate
            ? entry.validate(getIn(values, path))
            : undefined;
          errors = { ...errors, [path]: error };
        });
        return { ...draft, errors };
      }
      case A.SET_TREE_VALUE: {
        const match = treeMatcher(ctx.path);
        const base = draft.errors ?? prev.errors;
        const newValues = draft.values ?? prev.values;
        const next: Record<string, TError | undefined> = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            next[k] = base[k];
          } else if (hasPath(newValues, k)) {
            next[k] = base[k];
          }
        }
        return { ...draft, errors: next };
      }
      case A.RESET_BRANCH: {
        const match = treeMatcher(ctx.path);
        const base = draft.errors ?? prev.errors;
        const next: Record<string, TError | undefined> = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) next[k] = base[k];
        }
        return { ...draft, errors: next };
      }
      case A.VALIDATE_BRANCH: {
        const match = treeMatcher(ctx.path);
        let errors = draft.errors ?? prev.errors;
        const values = draft.values ?? prev.values;
        const all = registry.getAll();
        for (const [path, entry] of all) {
          if (!match(path)) continue;
          const error = entry.validate
            ? entry.validate(getIn(values, path))
            : undefined;
          errors = { ...errors, [path]: error };
        }
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
