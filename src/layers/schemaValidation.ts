import type { Enhancer } from "../core/types";
import type { FormResolver, FieldValidateMode } from "../validation/types";
import * as A from "../core/actions";
import { treeMatcher } from "../core/utils";

export function schemaValidationEnhancer<TValues, TError = string>(
  resolver: FormResolver<TValues, TError>,
  mode?: FieldValidateMode,
): Enhancer<TValues, TError> {
  const resolverMode = mode ?? "onChange";

  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path || resolverMode !== "onChange") return draft;
        if (draft.errors?.[ctx.path]) return draft;
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: { ...base, [ctx.path]: allErrors[ctx.path] },
        };
      }
      case A.BLUR: {
        if (!ctx.path || resolverMode !== "onBlur") return draft;
        if (draft.errors?.[ctx.path]) return draft;
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: { ...base, [ctx.path]: allErrors[ctx.path] },
        };
      }
      case A.VALIDATE_FIELD: {
        if (!ctx.path) return draft;
        if (draft.errors?.[ctx.path]) return draft;
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: { ...base, [ctx.path]: allErrors[ctx.path] },
        };
      }
      case A.ARRAY_APPEND:
      case A.ARRAY_REMOVE:
      case A.ARRAY_INSERT:
      case A.ARRAY_MOVE:
      case A.ARRAY_SWAP: {
        if (!ctx.path || resolverMode !== "onChange") return draft;
        if (draft.errors?.[ctx.path]) return draft;
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: { ...base, [ctx.path]: allErrors[ctx.path] },
        };
      }
      case A.SUBMIT: {
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        let errors = draft.errors ?? prev.errors;
        for (const [path, error] of Object.entries(allErrors)) {
          if (errors[path]) continue;
          if (error) errors = { ...errors, [path]: error };
        }
        return { ...draft, errors };
      }
      case A.VALIDATE_BRANCH: {
        const match = treeMatcher(ctx.path);
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        let errors = draft.errors ?? prev.errors;
        for (const [path, error] of Object.entries(allErrors)) {
          if (!match(path)) continue;
          if (errors[path]) continue;
          if (error) errors = { ...errors, [path]: error };
        }
        return { ...draft, errors };
      }
      default:
        return draft;
    }
  };
}
