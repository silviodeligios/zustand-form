import { F as FormState, a as FormResolver, b as FieldValidateMode, N as NamedEnhancer, E as Enhancer, c as Form, d as FieldValidatorEntry, D as Dispatch } from './types-TAKC4WR9.js';
export { A as ActionContext, e as ActionType, f as Actions, g as ArrayElement, h as DispatchOptions, i as FieldArrayItem, j as FieldArrayNamespace, k as FieldNamespace, l as FieldState, m as FormSelectors, I as InputProps, P as Path, n as PathValue, T as TreeNamespace } from './types-TAKC4WR9.js';
import { StateCreator } from 'zustand/vanilla';

interface FormConfig<TValues, TError = string> {
    initialState: Partial<FormState<TValues, TError>>;
    resolver?: FormResolver<TValues, TError> | undefined;
    resolverMode?: FieldValidateMode | undefined;
    enhancers?: ((defaults: NamedEnhancer<TValues, TError>[]) => (NamedEnhancer<TValues, TError> | Enhancer<TValues, TError>)[]) | undefined;
    middleware?: ((initializer: StateCreator<FormState<TValues, TError>>) => StateCreator<FormState<TValues, TError>, any, any>) | undefined;
}
declare function createForm<TValues, TError = string>(config: FormConfig<TValues, TError>): Form<TValues, TError>;

/** Deep get a value from an object using dot-notation path */
declare function getIn(obj: unknown, path: string): unknown;

declare function valuesEnhancer<TValues, TError = string>(defaultValues: TValues): Enhancer<TValues, TError>;

declare function touchedEnhancer<TValues, TError = string>(): Enhancer<TValues, TError>;

declare function dirtyEnhancer<TValues, TError = string>(defaultValues: TValues): Enhancer<TValues, TError>;

type ArrayReindexOp = {
    type: "remove";
    index: number;
} | {
    type: "insert";
    index: number;
} | {
    type: "move";
    from: number;
    to: number;
} | {
    type: "swap";
    from: number;
    to: number;
};
declare function reindexPathKeyedRecord<T>(record: Record<string, T>, arrayPath: string, op: ArrayReindexOp): Record<string, T>;

interface FieldRegistry<TError = string> {
    register(path: string, entry: FieldValidatorEntry<TError>): void;
    unregister(path: string): void;
    get(path: string): FieldValidatorEntry<TError> | undefined;
    getAll(): Map<string, FieldValidatorEntry<TError>>;
    /** Get and increment the async version for a path (for stale cancellation) */
    nextVersion(path: string): number;
    /** Get current async version for a path */
    getVersion(path: string): number;
    /** Store a debounce timer for a path */
    setTimer(path: string, timer: ReturnType<typeof setTimeout>): void;
    /** Clear debounce timer for a path */
    clearTimer(path: string): void;
    /** Reindex all internal maps after an array operation */
    reindex(arrayPath: string, op: ArrayReindexOp): void;
    /** Create an async session that tracks the current path across reindex ops */
    createSession(path: string, version: number): number;
    /** Get a session by ID (path may have been updated by reindex) */
    getSession(id: number): {
        path: string;
        version: number;
    } | undefined;
    /** Delete a session */
    deleteSession(id: number): void;
}

declare function validationEnhancer<TValues, TError = string>(registry: FieldRegistry<TError>): Enhancer<TValues, TError>;

declare function submitEnhancer<TValues, TError = string>(): Enhancer<TValues, TError>;

declare function schemaValidationEnhancer<TValues, TError = string>(resolver: FormResolver<TValues, TError>, mode?: FieldValidateMode): Enhancer<TValues, TError>;

declare function asyncValidationEnhancer<TValues, TError = string>(registry: FieldRegistry<TError>, dispatch: Dispatch): Enhancer<TValues, TError>;

/** Minimal Standard Schema interface compatible with Zod 4, Valibot, ArkType, etc. */
interface StandardSchemaIssue {
    path?: ReadonlyArray<PropertyKey | {
        key: PropertyKey;
    }>;
    message: string;
}
interface StandardSchemaResult<T> {
    value?: T;
    issues?: ReadonlyArray<StandardSchemaIssue>;
}
interface StandardSchema<T = unknown> {
    "~standard": {
        version: number;
        validate(input: unknown): StandardSchemaResult<T> | Promise<StandardSchemaResult<T>>;
    };
}
/** Creates a FormResolver from any Standard Schema (Zod 4, Valibot, ArkType, etc.) */
declare function standardSchemaResolver<TValues>(schema: StandardSchema<TValues>): FormResolver<TValues>;

export { type ArrayReindexOp, Dispatch, Enhancer, FieldValidateMode, FieldValidatorEntry, Form, type FormConfig, FormResolver, FormState, NamedEnhancer, asyncValidationEnhancer, createForm, dirtyEnhancer, getIn, reindexPathKeyedRecord, schemaValidationEnhancer, standardSchemaResolver, submitEnhancer, touchedEnhancer, validationEnhancer, valuesEnhancer };
