import type { ActionContext, Enhancer, FormState } from "../core/types";
import type { FormResolver, FieldValidateMode } from "../validation/types";
import * as A from "../core/actions";
import { treeMatcher } from "../utils/tree";
import { indexPathToKeyPath, keyPathToIndexPath } from "../utils/arrayKeys";

/** Translate all resolver error paths from index-based to key-based */
function translateAllErrors<TError>(
  allErrors: Record<string, TError | undefined>,
  arrayKeys: Record<string, string[]>,
): Record<string, TError | undefined> {
  const translated: Record<string, TError | undefined> = {};
  for (const [p, error] of Object.entries(allErrors)) {
    translated[indexPathToKeyPath(p, arrayKeys)] = error;
  }
  return translated;
}

/**
 * Look up the error for a single key-based path from the resolver output.
 * Avoids translating ALL error paths when only one is needed.
 */
function resolverErrorForPath<TValues, TError>(
  resolver: FormResolver<TValues, TError>,
  values: TValues,
  keyPath: string,
  arrayKeys: Record<string, string[]>,
): TError | undefined {
  const allErrors = resolver.validate(values);
  const indexPath = keyPathToIndexPath(keyPath, arrayKeys);
  return allErrors[indexPath];
}

function schemaValidateSinglePath<TValues, TError>(
  ctx: ActionContext,
  prev: FormState<TValues, TError>,
  draft: Partial<FormState<TValues, TError>>,
  resolver: FormResolver<TValues, TError>,
): Partial<FormState<TValues, TError>> {
  if (!ctx.path) return draft;
  if (draft.errors?.[ctx.path]) return draft;
  const values = draft.values ?? prev.values;
  const ak = draft.arrayKeys ?? prev.arrayKeys;
  const error = resolverErrorForPath(resolver, values, ctx.path, ak);
  const base = draft.errors ?? prev.errors;
  return { ...draft, errors: { ...base, [ctx.path]: error } };
}

export function schemaValidationEnhancer<TValues, TError = string>(
  resolver: FormResolver<TValues, TError>,
  mode?: FieldValidateMode,
): Enhancer<TValues, TError> {
  const resolverMode = mode ?? "onChange";

  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path || resolverMode !== "onChange") return draft;
        return schemaValidateSinglePath(ctx, prev, draft, resolver);
      }
      case A.BLUR: {
        if (!ctx.path || resolverMode !== "onBlur") return draft;
        return schemaValidateSinglePath(ctx, prev, draft, resolver);
      }
      case A.VALIDATE_FIELD:
        return schemaValidateSinglePath(ctx, prev, draft, resolver);
      case A.ARRAY_APPEND:
      case A.ARRAY_REMOVE:
      case A.ARRAY_INSERT:
      case A.ARRAY_MOVE:
      case A.ARRAY_SWAP:
      case A.ARRAY_SORT: {
        if (!ctx.path || resolverMode !== "onChange") return draft;
        return schemaValidateSinglePath(ctx, prev, draft, resolver);
      }
      case A.SUBMIT: {
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const allErrors = translateAllErrors(resolver.validate(values), ak);
        let errors = draft.errors ?? prev.errors;
        for (const [path, error] of Object.entries(allErrors)) {
          if (errors[path]) continue;
          errors = { ...errors, [path]: error };
        }
        return { ...draft, errors };
      }
      case A.SET_TREE_VALUE: {
        if (resolverMode !== "onChange") return draft;
        const match = treeMatcher(ctx.path);
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const allErrors = translateAllErrors(resolver.validate(values), ak);
        let errors = draft.errors ?? prev.errors;
        for (const [path, error] of Object.entries(allErrors)) {
          if (!match(path)) continue;
          if (errors[path]) continue;
          errors = { ...errors, [path]: error };
        }
        return { ...draft, errors };
      }
      case A.VALIDATE_BRANCH: {
        const match = treeMatcher(ctx.path);
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const allErrors = translateAllErrors(resolver.validate(values), ak);
        let errors = draft.errors ?? prev.errors;
        for (const [path, error] of Object.entries(allErrors)) {
          if (!match(path)) continue;
          if (errors[path]) continue;
          errors = { ...errors, [path]: error };
        }
        return { ...draft, errors };
      }
      default:
        return draft;
    }
  };
}
