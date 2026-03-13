import type { Enhancer } from "../core/types";
import * as A from "../core/actions";
import { indexPathToKeyPath } from "../utils/arrayKeys";

export function submitEnhancer<TValues, TError = string>(): Enhancer<
  TValues,
  TError
> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SUBMIT:
        return {
          ...draft,
          isSubmitting: true,
          submitCount: prev.submitCount + 1,
          isSubmitSuccessful: false,
        };
      case A.SUBMIT_SUCCESS:
        return { ...draft, isSubmitting: false, isSubmitSuccessful: true };
      case A.SUBMIT_FAILURE: {
        const next = { ...draft, isSubmitting: false, isSubmitSuccessful: false };
        if (ctx.value != null && typeof ctx.value === "object" && !Array.isArray(ctx.value)) {
          const serverErrors = ctx.value as Record<string, TError>;
          const ak = draft.arrayKeys ?? prev.arrayKeys;
          const errors = { ...(draft.errors ?? prev.errors) };
          for (const [path, error] of Object.entries(serverErrors)) {
            errors[indexPathToKeyPath(path, ak)] = error;
          }
          next.errors = errors;
        }
        return next;
      }
      case A.RESET_FORM:
        return {
          ...draft,
          isSubmitting: false,
          submitCount: 0,
          isSubmitSuccessful: false,
        };
      default:
        return draft;
    }
  };
}
