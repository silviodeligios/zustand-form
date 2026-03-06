import type { FormState } from './core/types'

export interface FormSelectors<TValues> {
  values:             (s: FormState<TValues>) => TValues
  isSubmitting:       (s: FormState<TValues>) => boolean
  submitCount:        (s: FormState<TValues>) => number
  isSubmitSuccessful: (s: FormState<TValues>) => boolean
  focusedField:       (s: FormState<TValues>) => string | null
}
