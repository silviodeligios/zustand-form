import type { FormState } from "./core/types";

export interface FormSelectors<TValues, TError = string> {
  values: (s: FormState<TValues, TError>) => TValues;
  isSubmitting: (s: FormState<TValues, TError>) => boolean;
  submitCount: (s: FormState<TValues, TError>) => number;
  isSubmitSuccessful: (s: FormState<TValues, TError>) => boolean;
  focusedField: (s: FormState<TValues, TError>) => string | null;
}
