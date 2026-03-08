// Field validation types (side-channel, not stored in zustand)

export type FieldValidateMode = "onChange" | "onBlur" | "onSubmit";

export interface FieldValidatorEntry<TError = string> {
  /** Sync validator — runs immediately in the pipeline */
  validate?: ((value: unknown) => TError | undefined) | undefined;
  /** When to run sync validate. Default "onChange" */
  validateMode?: FieldValidateMode | undefined;
  /** Async validator — runs after sync passes, field is dirty */
  asyncValidate?: ((value: unknown) => Promise<TError | undefined>) | undefined;
  /** When to run async validate. Default "onChange" */
  asyncValidateMode?: "onChange" | "onBlur" | undefined;
  /** Debounce delay in ms for async validation */
  debounce?: number | undefined;
}

/** Form-level schema resolver — validates one field at a time given full values */
export interface FormResolver<TValues, TError = string> {
  validateField(path: string, values: TValues): TError | undefined;
}
