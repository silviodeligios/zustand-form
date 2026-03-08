import type { FormState, DispatchOptions } from "../core/types";

type Selector<TValues, TError, R> = (s: FormState<TValues, TError>) => R;

export interface TreeNamespace<TValues, TError = string> {
  isDirty(path?: string): boolean;
  isTouched(path?: string): boolean;
  isPending(path?: string): boolean;
  isValid(path?: string): boolean;
  getErrors(path?: string): Record<string, TError>;
  getDirtyFields(path?: string): string[];
  getTouchedFields(path?: string): string[];
  clearErrors(path?: string, options?: DispatchOptions): void;
  reset(path?: string, options?: DispatchOptions): void;
  validate(path?: string, options?: DispatchOptions): void;
  select: {
    dirty(path?: string): Selector<TValues, TError, boolean>;
    touched(path?: string): Selector<TValues, TError, boolean>;
    pending(path?: string): Selector<TValues, TError, boolean>;
    valid(path?: string): Selector<TValues, TError, boolean>;
    errors(path?: string): Selector<TValues, TError, Record<string, TError>>;
    dirtyFields(path?: string): Selector<TValues, TError, string[]>;
    touchedFields(path?: string): Selector<TValues, TError, string[]>;
    errorCount(path?: string): Selector<TValues, TError, number>;
  };
}
