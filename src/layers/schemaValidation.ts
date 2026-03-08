import type { Enhancer } from "../core/types";
import type { FormResolver, FieldValidateMode } from "../validation/types";
import * as A from "../core/actions";

export function schemaValidationEnhancer<TValues>(
  resolver: FormResolver<TValues>,
  mode?: FieldValidateMode,
): Enhancer<TValues> {
  const resolverMode = mode ?? "onChange";

  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path || resolverMode !== "onChange") return draft;
        // Skip only if a field-level validator already set an error in this pipeline run
        if (draft.errors?.[ctx.path]) return draft;
        const values = draft.values ?? prev.values;
        const error = resolver.validateField(ctx.path, values);
        const base = draft.errors ?? prev.errors;
        return { ...draft, errors: { ...base, [ctx.path]: error } };
      }
      case A.BLUR: {
        if (!ctx.path || resolverMode !== "onBlur") return draft;
        if (draft.errors?.[ctx.path]) return draft;
        const values = draft.values ?? prev.values;
        const error = resolver.validateField(ctx.path, values);
        const base = draft.errors ?? prev.errors;
        return { ...draft, errors: { ...base, [ctx.path]: error } };
      }
      case A.VALIDATE_FIELD: {
        if (!ctx.path) return draft;
        if (draft.errors?.[ctx.path]) return draft;
        const values = draft.values ?? prev.values;
        const error = resolver.validateField(ctx.path, values);
        const base = draft.errors ?? prev.errors;
        return { ...draft, errors: { ...base, [ctx.path]: error } };
      }
      default:
        return draft;
    }
  };
}
