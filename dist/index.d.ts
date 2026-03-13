import { F as FormState, a as FormResolver, b as FieldValidateMode, N as NamedEnhancer, c as Form, E as Enhancer, d as FieldValidatorEntry, D as Dispatch } from './types-BGUOcecc.js';
export { A as ActionContext, e as ActionType, f as Actions, g as ArrayElement, h as DeepLeaf, i as DispatchOptions, j as FieldArrayItem, k as FieldArrayNamespace, l as FieldNamespace, m as FieldState, n as FormSelectors, I as InputProps, P as Path, o as PathValue, T as TreeNamespace } from './types-BGUOcecc.js';
import { StateCreator } from 'zustand/vanilla';

interface FormConfig<TValues, TError = string> {
    initialState: Partial<FormState<TValues, TError>>;
    resolver?: FormResolver<TValues, TError> | undefined;
    resolverMode?: FieldValidateMode | undefined;
    enhancers?: ((defaults: NamedEnhancer<TValues, TError>[]) => NamedEnhancer<TValues, TError>[]) | undefined;
    middleware?: ((initializer: StateCreator<FormState<TValues, TError>>) => StateCreator<FormState<TValues, TError>, any, any>) | undefined;
}
declare function createForm<TValues, TError = string>(config: FormConfig<TValues, TError>): Form<TValues, TError>;

/** Deep get a value from an object using dot-notation path */
declare function getIn(obj: unknown, path: string): unknown;

declare function valuesEnhancer<TValues, TError = string>(defaultValues: TValues, initialArrayKeys: Record<string, string[]>): Enhancer<TValues, TError>;

declare function touchedEnhancer<TValues, TError = string>(): Enhancer<TValues, TError>;

declare function dirtyEnhancer<TValues, TError = string>(defaultValues: TValues, initialArrayKeys: Record<string, string[]>): Enhancer<TValues, TError>;

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
    /** Remove all registry entries whose path starts with the given prefix */
    removeByPrefix(prefix: string): void;
}

declare function validationEnhancer<TValues, TError = string>(registry: FieldRegistry<TError>): Enhancer<TValues, TError>;

declare function submitEnhancer<TValues, TError = string>(): Enhancer<TValues, TError>;

declare function schemaValidationEnhancer<TValues, TError = string>(resolver: FormResolver<TValues, TError>, mode?: FieldValidateMode): Enhancer<TValues, TError>;

declare function asyncValidationEnhancer<TValues, TError = string>(registry: FieldRegistry<TError>, dispatch: Dispatch): Enhancer<TValues, TError>;

/** Check if a path segment is a stable array key (e.g., "_k0", "_k42") */
declare function isArrayKey(segment: string): boolean;
/**
 * Translate an index-based path to a key-based path for metadata lookups.
 * Numeric segments that correspond to known arrays in arrayKeys are replaced
 * with stable keys. Already key-based segments pass through unchanged.
 *
 * Example: "items.0.name" → "items._k0.name"
 */
declare function indexPathToKeyPath(path: string, arrayKeys: Record<string, string[]>): string;
/**
 * Translate a key-based path to an index-based path for value access.
 * Stable key segments are replaced with their numeric index in the ordered
 * arrayKeys array.
 *
 * Example: "items._k0.name" → "items.0.name"
 */
declare function keyPathToIndexPath(path: string, arrayKeys: Record<string, string[]>): string;
/**
 * Walk a value tree and build an arrayKeys map for all arrays found.
 * Values are NOT modified — this only generates the key mapping.
 * Key paths in arrayKeys use stable `_k` segments for array elements.
 */
declare function scanArrayKeys(value: unknown, parentKeyPath: string, startCounter: number): {
    arrayKeys: Record<string, string[]>;
    nextCounter: number;
};
/**
 * Remove all entries from a Record whose key equals prefix or starts with prefix + ".".
 * Returns the same reference if nothing was removed (fast early exit).
 */
declare function removeByPrefix<T>(record: Record<string, T>, keyPrefix: string): Record<string, T>;
/** @deprecated Use `removeByPrefix` instead */
declare const removeKeyedEntries: typeof removeByPrefix;
/**
 * Get a value at a key-based path by translating to index-based first.
 * Shorthand for `getIn(values, keyPathToIndexPath(keyPath, arrayKeys))`.
 */
declare function getValueAtKeyPath(values: unknown, keyPath: string, arrayKeys: Record<string, string[]>): unknown;

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

export { Dispatch, Enhancer, FieldValidateMode, FieldValidatorEntry, Form, type FormConfig, FormResolver, FormState, NamedEnhancer, asyncValidationEnhancer, createForm, dirtyEnhancer, getIn, getValueAtKeyPath, indexPathToKeyPath, isArrayKey, keyPathToIndexPath, removeByPrefix, removeKeyedEntries, scanArrayKeys, schemaValidationEnhancer, standardSchemaResolver, submitEnhancer, touchedEnhancer, validationEnhancer, valuesEnhancer };
