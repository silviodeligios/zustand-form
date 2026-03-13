import type { Enhancer, FormState } from "../core/types";
import type { FieldRegistry } from "../validation/registry";
import * as A from "../core/actions";
import { hasPath } from "../utils/paths";
import { treeMatcher } from "../utils/tree";
import { removeByPrefix, getValueAtKeyPath, keyPathToIndexPath } from "../utils/arrayKeys";

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
    const ak = draft.arrayKeys ?? prev.arrayKeys;
    const error = entry.validate(getValueAtKeyPath(values, path, ak));
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
        if (entry?.validate && (entry.validateMode ?? "onChange") === "onChange") {
          const values = draft.values ?? prev.values;
          const ak = draft.arrayKeys ?? prev.arrayKeys;
          const error = entry.validate(getValueAtKeyPath(values, ctx.path, ak));
          const base = draft.errors ?? prev.errors;
          return { ...draft, errors: { ...base, [ctx.path]: error } };
        }
        // Field has onBlur validation — don't clear
        if (entry?.validate) return draft;
        // No validation registered — clear stale error (e.g. server error)
        const base = draft.errors ?? prev.errors;
        if (base[ctx.path] === undefined) return draft;
        return { ...draft, errors: { ...base, [ctx.path]: undefined } };
      }
      case A.BLUR: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (!entry?.validate || entry.validateMode !== "onBlur") return draft;
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const error = entry.validate(getValueAtKeyPath(values, ctx.path, ak));
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
        const base = draft.errors ?? prev.errors;

        if (ctx.value) {
          // Async returned an error: only apply if still pending (stale guard)
          if (!pending[ctx.path]) return draft;
          return {
            ...draft,
            errors: { ...base, [ctx.path]: ctx.value as TError },
          };
        }

        // Clear error (async resolved clean, or unregister cleanup).
        // Always allow: unmounted fields need orphaned errors removed.
        if (base[ctx.path] === undefined) return draft;
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const error = entry.validate(getValueAtKeyPath(values, ctx.path, ak));
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
        const prevKeys = prev.arrayKeys[ctx.path] ?? [];
        const removedKey = prevKeys[ctx.index!];
        let errors = draft.errors ?? prev.errors;
        if (removedKey) {
          errors = removeByPrefix(errors, ctx.path + "." + removedKey);
        }
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path) return draft;
        return validateArrayPath(
          draft.errors ?? prev.errors,
          draft,
          prev,
          ctx.path,
          registry,
        );
      }
      case A.ARRAY_MOVE:
      case A.ARRAY_SWAP:
      case A.ARRAY_SORT: {
        if (!ctx.path) return draft;
        return validateArrayPath(
          draft.errors ?? prev.errors,
          draft,
          prev,
          ctx.path,
          registry,
        );
      }
      case A.SUBMIT: {
        let errors = draft.errors ?? prev.errors;
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const all = registry.getAll();
        all.forEach((entry, path) => {
          const error = entry.validate
            ? entry.validate(getValueAtKeyPath(values, path, ak))
            : undefined;
          errors = { ...errors, [path]: error };
        });
        return { ...draft, errors };
      }
      case A.SET_TREE_VALUE: {
        const match = treeMatcher(ctx.path);
        const base = draft.errors ?? prev.errors;
        const newValues = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const next: Record<string, TError | undefined> = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            next[k] = base[k];
          } else {
            const idxPath = keyPathToIndexPath(k, ak);
            if (hasPath(newValues, idxPath)) {
              next[k] = base[k];
            }
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const all = registry.getAll();
        for (const [path, entry] of all) {
          if (!match(path)) continue;
          const error = entry.validate
            ? entry.validate(getValueAtKeyPath(values, path, ak))
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
