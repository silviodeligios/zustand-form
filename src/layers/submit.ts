import type { Enhancer } from "../core/types";
import * as A from "../core/actions";

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
      case A.SUBMIT_FAILURE:
        return { ...draft, isSubmitting: false, isSubmitSuccessful: false };
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
