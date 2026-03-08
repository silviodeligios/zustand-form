import type { FormState, DispatchOptions } from "../core/types";

type Selector<TValues, R> = (s: FormState<TValues>) => R;

export interface TreeNamespace<TValues> {
  isDirty(path?: string): boolean;
  isTouched(path?: string): boolean;
  isPending(path?: string): boolean;
  isValid(path?: string): boolean;
  getErrors(path?: string): Record<string, string>;
  getDirtyFields(path?: string): string[];
  getTouchedFields(path?: string): string[];
  clearErrors(path?: string, options?: DispatchOptions): void;
  reset(path?: string, options?: DispatchOptions): void;
  validate(path?: string, options?: DispatchOptions): void;
  select: {
    dirty(path?: string): Selector<TValues, boolean>;
    touched(path?: string): Selector<TValues, boolean>;
    pending(path?: string): Selector<TValues, boolean>;
    valid(path?: string): Selector<TValues, boolean>;
    errors(path?: string): Selector<TValues, Record<string, string>>;
    dirtyFields(path?: string): Selector<TValues, string[]>;
    touchedFields(path?: string): Selector<TValues, string[]>;
    errorCount(path?: string): Selector<TValues, number>;
  };
}
