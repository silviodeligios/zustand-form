// Field validation types (side-channel, not stored in zustand)

export type FieldValidateMode = "onChange" | "onBlur" | "onSubmit";

export interface FieldValidatorEntry<TError = string, TValue = unknown> {
  /** Sync validator — runs immediately in the pipeline */
  validate?: ((value: TValue) => TError | undefined) | undefined;
  /** When to run sync validate. Default "onChange" */
  validateMode?: FieldValidateMode | undefined;
  /** Async validator — runs after sync passes, field is dirty */
  asyncValidate?: ((value: TValue) => Promise<TError | undefined>) | undefined;
  /** When to run async validate. Default "onChange" */
  asyncValidateMode?: "onChange" | "onBlur" | undefined;
  /** Debounce delay in ms for async validation */
  debounce?: number | undefined;
}

/** Form-level schema resolver — validates all fields given full values */
export interface FormResolver<TValues, TError = string> {
  validate(values: TValues): Record<string, TError | undefined>;
}
