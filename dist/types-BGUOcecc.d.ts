import { StoreApi } from 'zustand/vanilla';

/** Depth counter to limit recursion (5 levels) */
type Prev = [never, 0, 1, 2, 3, 4];
/** All valid dot-notation paths for T */
type Path<T, D extends number = 5> = [D] extends [never] ? string : T extends readonly (infer U)[] ? `${number}` | `${number}.${Path<U, Prev[D]>}` : T extends object ? {
    [K in keyof T & string]: K | `${K}.${Path<T[K], Prev[D]>}`;
}[keyof T & string] : never;
/** Value type at path P inside T */
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}` ? K extends keyof T ? PathValue<T[K], Rest> : K extends `${number}` ? T extends readonly (infer U)[] ? PathValue<U, Rest> : unknown : unknown : P extends keyof T ? T[P] : P extends `${number}` ? T extends readonly (infer U)[] ? U : unknown : unknown;
/** Element type of an array */
type ArrayElement<T> = T extends readonly (infer U)[] ? U : unknown;

declare const SET_VALUE: "SET_VALUE";
declare const SET_ERROR: "SET_ERROR";
declare const CLEAR_ERROR: "CLEAR_ERROR";
declare const SET_TOUCHED: "SET_TOUCHED";
declare const SET_DIRTY: "SET_DIRTY";
declare const FOCUS: "FOCUS";
declare const BLUR: "BLUR";
declare const VALIDATE_FIELD: "VALIDATE_FIELD";
declare const RESET_FIELD: "RESET_FIELD";
declare const CLEAR_ERRORS_BRANCH: "CLEAR_ERRORS_BRANCH";
declare const RESET_BRANCH: "RESET_BRANCH";
declare const VALIDATE_BRANCH: "VALIDATE_BRANCH";
declare const SET_TREE_VALUE: "SET_TREE_VALUE";
declare const ASYNC_RESOLVE: "ASYNC_RESOLVE";
declare const ARRAY_APPEND: "ARRAY_APPEND";
declare const ARRAY_REMOVE: "ARRAY_REMOVE";
declare const ARRAY_INSERT: "ARRAY_INSERT";
declare const ARRAY_MOVE: "ARRAY_MOVE";
declare const ARRAY_SWAP: "ARRAY_SWAP";
declare const ARRAY_SORT: "ARRAY_SORT";
declare const RESET_FORM: "RESET_FORM";
declare const SUBMIT: "SUBMIT";
declare const SUBMIT_SUCCESS: "SUBMIT_SUCCESS";
declare const SUBMIT_FAILURE: "SUBMIT_FAILURE";

declare const actions_ARRAY_APPEND: typeof ARRAY_APPEND;
declare const actions_ARRAY_INSERT: typeof ARRAY_INSERT;
declare const actions_ARRAY_MOVE: typeof ARRAY_MOVE;
declare const actions_ARRAY_REMOVE: typeof ARRAY_REMOVE;
declare const actions_ARRAY_SORT: typeof ARRAY_SORT;
declare const actions_ARRAY_SWAP: typeof ARRAY_SWAP;
declare const actions_ASYNC_RESOLVE: typeof ASYNC_RESOLVE;
declare const actions_BLUR: typeof BLUR;
declare const actions_CLEAR_ERROR: typeof CLEAR_ERROR;
declare const actions_CLEAR_ERRORS_BRANCH: typeof CLEAR_ERRORS_BRANCH;
declare const actions_FOCUS: typeof FOCUS;
declare const actions_RESET_BRANCH: typeof RESET_BRANCH;
declare const actions_RESET_FIELD: typeof RESET_FIELD;
declare const actions_RESET_FORM: typeof RESET_FORM;
declare const actions_SET_DIRTY: typeof SET_DIRTY;
declare const actions_SET_ERROR: typeof SET_ERROR;
declare const actions_SET_TOUCHED: typeof SET_TOUCHED;
declare const actions_SET_TREE_VALUE: typeof SET_TREE_VALUE;
declare const actions_SET_VALUE: typeof SET_VALUE;
declare const actions_SUBMIT: typeof SUBMIT;
declare const actions_SUBMIT_FAILURE: typeof SUBMIT_FAILURE;
declare const actions_SUBMIT_SUCCESS: typeof SUBMIT_SUCCESS;
declare const actions_VALIDATE_BRANCH: typeof VALIDATE_BRANCH;
declare const actions_VALIDATE_FIELD: typeof VALIDATE_FIELD;
declare namespace actions {
  export { actions_ARRAY_APPEND as ARRAY_APPEND, actions_ARRAY_INSERT as ARRAY_INSERT, actions_ARRAY_MOVE as ARRAY_MOVE, actions_ARRAY_REMOVE as ARRAY_REMOVE, actions_ARRAY_SORT as ARRAY_SORT, actions_ARRAY_SWAP as ARRAY_SWAP, actions_ASYNC_RESOLVE as ASYNC_RESOLVE, actions_BLUR as BLUR, actions_CLEAR_ERROR as CLEAR_ERROR, actions_CLEAR_ERRORS_BRANCH as CLEAR_ERRORS_BRANCH, actions_FOCUS as FOCUS, actions_RESET_BRANCH as RESET_BRANCH, actions_RESET_FIELD as RESET_FIELD, actions_RESET_FORM as RESET_FORM, actions_SET_DIRTY as SET_DIRTY, actions_SET_ERROR as SET_ERROR, actions_SET_TOUCHED as SET_TOUCHED, actions_SET_TREE_VALUE as SET_TREE_VALUE, actions_SET_VALUE as SET_VALUE, actions_SUBMIT as SUBMIT, actions_SUBMIT_FAILURE as SUBMIT_FAILURE, actions_SUBMIT_SUCCESS as SUBMIT_SUCCESS, actions_VALIDATE_BRANCH as VALIDATE_BRANCH, actions_VALIDATE_FIELD as VALIDATE_FIELD };
}

interface FieldState<TError = string> {
    dirty: boolean;
    touched: boolean;
    error: TError | undefined;
    pending: boolean;
    focused: boolean;
}
interface InputProps<TValue = unknown> {
    value: TValue;
    onChange(value: TValue): void;
    onBlur(): void;
    onFocus(): void;
}
type Selector$2<TValues, TError, R> = (s: FormState<TValues, TError>) => R;
/** Accepts Path<TValues> for autocomplete, or any string for dynamic paths */
type FieldPath$2<TValues> = Path<TValues> | (string & Record<never, never>);
interface FieldNamespace<TValues, TError = string> {
    getValue<P extends Path<TValues>>(path: P): PathValue<TValues, P>;
    getValue(path: string): unknown;
    isDirty(path: FieldPath$2<TValues>): boolean;
    isTouched(path: FieldPath$2<TValues>): boolean;
    isPending(path: FieldPath$2<TValues>): boolean;
    getError(path: FieldPath$2<TValues>): TError | undefined;
    setValue<P extends Path<TValues>>(path: P, value: PathValue<TValues, P>, options?: DispatchOptions): void;
    setValue(path: string, value: unknown, options?: DispatchOptions): void;
    setError(path: FieldPath$2<TValues>, error: TError, options?: DispatchOptions): void;
    clearError(path: FieldPath$2<TValues>, options?: DispatchOptions): void;
    setTouched(path: FieldPath$2<TValues>, value?: boolean, options?: DispatchOptions): void;
    setDirty(path: FieldPath$2<TValues>, value?: boolean, options?: DispatchOptions): void;
    focus(path: FieldPath$2<TValues>, options?: DispatchOptions): void;
    blur(path: FieldPath$2<TValues>, options?: DispatchOptions): void;
    validate(path: FieldPath$2<TValues>, options?: DispatchOptions): void;
    reset(path: FieldPath$2<TValues>, options?: DispatchOptions): void;
    select: {
        value<P extends Path<TValues>>(path: P): Selector$2<TValues, TError, PathValue<TValues, P>>;
        value(path: string): Selector$2<TValues, TError, unknown>;
        error(path: FieldPath$2<TValues>): Selector$2<TValues, TError, TError | undefined>;
        dirty(path: FieldPath$2<TValues>): Selector$2<TValues, TError, boolean>;
        touched(path: FieldPath$2<TValues>): Selector$2<TValues, TError, boolean>;
        pending(path: FieldPath$2<TValues>): Selector$2<TValues, TError, boolean>;
        focused(path: FieldPath$2<TValues>): Selector$2<TValues, TError, boolean>;
        fieldState(path: FieldPath$2<TValues>): Selector$2<TValues, TError, FieldState<TError>>;
        inputProps<P extends Path<TValues>>(path: P): Selector$2<TValues, TError, InputProps<PathValue<TValues, P>>>;
        inputProps(path: string): Selector$2<TValues, TError, InputProps>;
    };
}

type Selector$1<TValues, TError, R> = (s: FormState<TValues, TError>) => R;
/** Accepts Path<TValues> for autocomplete, or any string for dynamic paths */
type FieldPath$1<TValues> = Path<TValues> | (string & Record<never, never>);
/** Nested structure mirroring the values shape with `L` at the leaves */
type DeepLeaf<T, L> = T extends (infer U)[] ? (DeepLeaf<U, L> | undefined)[] : T extends Record<string, unknown> ? {
    [K in keyof T]?: DeepLeaf<T[K], L>;
} : L;
interface TreeNamespace<TValues, TError = string> {
    isDirty(path?: FieldPath$1<TValues>): boolean;
    isTouched(path?: FieldPath$1<TValues>): boolean;
    isPending(path?: FieldPath$1<TValues>): boolean;
    isValid(path?: FieldPath$1<TValues>): boolean;
    getErrors(path?: FieldPath$1<TValues>): DeepLeaf<TValues, TError>;
    getDirtyFields(path?: FieldPath$1<TValues>): DeepLeaf<TValues, boolean>;
    getTouchedFields(path?: FieldPath$1<TValues>): DeepLeaf<TValues, boolean>;
    setValue(value: TValues): void;
    setValue(path: FieldPath$1<TValues>, value: unknown): void;
    clearErrors(path?: FieldPath$1<TValues>, options?: DispatchOptions): void;
    reset(path?: FieldPath$1<TValues>, options?: DispatchOptions): void;
    validate(path?: FieldPath$1<TValues>, options?: DispatchOptions): void;
    select: {
        dirty(path?: FieldPath$1<TValues>): Selector$1<TValues, TError, boolean>;
        touched(path?: FieldPath$1<TValues>): Selector$1<TValues, TError, boolean>;
        pending(path?: FieldPath$1<TValues>): Selector$1<TValues, TError, boolean>;
        valid(path?: FieldPath$1<TValues>): Selector$1<TValues, TError, boolean>;
        errors(path?: FieldPath$1<TValues>): Selector$1<TValues, TError, DeepLeaf<TValues, TError>>;
        dirtyFields(path?: FieldPath$1<TValues>): Selector$1<TValues, TError, DeepLeaf<TValues, boolean>>;
        touchedFields(path?: FieldPath$1<TValues>): Selector$1<TValues, TError, DeepLeaf<TValues, boolean>>;
        errorCount(path?: FieldPath$1<TValues>): Selector$1<TValues, TError, number>;
    };
}

interface FieldArrayItem {
    id: string;
    index: number;
}
type Selector<TValues, TError, R> = (s: FormState<TValues, TError>) => R;
/** Accepts Path<TValues> for autocomplete, or any string for dynamic paths */
type FieldPath<TValues> = Path<TValues> | (string & Record<never, never>);
interface FieldArrayNamespace<TValues, TError = string> {
    getLength(path: FieldPath<TValues>): number;
    getKeys(path: FieldPath<TValues>): string[];
    append<P extends Path<TValues>>(path: P, value: ArrayElement<PathValue<TValues, P>>, options?: DispatchOptions): void;
    append(path: string, value: unknown, options?: DispatchOptions): void;
    prepend<P extends Path<TValues>>(path: P, value: ArrayElement<PathValue<TValues, P>>, options?: DispatchOptions): void;
    prepend(path: string, value: unknown, options?: DispatchOptions): void;
    remove(path: FieldPath<TValues>, index: number, options?: DispatchOptions): void;
    insert<P extends Path<TValues>>(path: P, index: number, value: ArrayElement<PathValue<TValues, P>>, options?: DispatchOptions): void;
    insert(path: string, index: number, value: unknown, options?: DispatchOptions): void;
    move(path: FieldPath<TValues>, from: number, to: number, options?: DispatchOptions): void;
    replace<P extends Path<TValues>>(path: P, value: PathValue<TValues, P>, options?: DispatchOptions): void;
    replace(path: string, value: unknown, options?: DispatchOptions): void;
    swap(path: FieldPath<TValues>, indexA: number, indexB: number, options?: DispatchOptions): void;
    sort<P extends Path<TValues>>(path: P, comparator: (a: ArrayElement<PathValue<TValues, P>>, b: ArrayElement<PathValue<TValues, P>>) => number, options?: DispatchOptions): void;
    sort(path: string, comparator: (a: unknown, b: unknown) => number, options?: DispatchOptions): void;
    reorder(path: FieldPath<TValues>, permutation: number[], options?: DispatchOptions): void;
    select: {
        length(path: FieldPath<TValues>): Selector<TValues, TError, number>;
        keys(path: FieldPath<TValues>): Selector<TValues, TError, string[]>;
    };
}

interface FormSelectors<TValues, TError = string> {
    values: (s: FormState<TValues, TError>) => TValues;
    isSubmitting: (s: FormState<TValues, TError>) => boolean;
    submitCount: (s: FormState<TValues, TError>) => number;
    isSubmitSuccessful: (s: FormState<TValues, TError>) => boolean;
    focusedField: (s: FormState<TValues, TError>) => string | null;
}

type FieldValidateMode = "onChange" | "onBlur" | "onSubmit";
interface FieldValidatorEntry<TError = string, TValue = unknown> {
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
interface FormResolver<TValues, TError = string> {
    validate(values: TValues): Record<string, TError | undefined>;
}

interface FormState<TValues, TError = string> {
    values: TValues;
    arrayKeys: Record<string, string[]>;
    _keyCounter: number;
    dirtyFields: Record<string, boolean>;
    touchedFields: Record<string, boolean>;
    errors: Record<string, TError | undefined>;
    pendingFields: Record<string, boolean>;
    focusedField: string | null;
    isSubmitting: boolean;
    submitCount: number;
    isSubmitSuccessful: boolean;
}
interface DispatchOptions {
    disableLayers?: string[];
}
type ActionType = typeof SET_VALUE | typeof SET_ERROR | typeof CLEAR_ERROR | typeof SET_TOUCHED | typeof SET_DIRTY | typeof FOCUS | typeof BLUR | typeof VALIDATE_FIELD | typeof RESET_FIELD | typeof ASYNC_RESOLVE | typeof CLEAR_ERRORS_BRANCH | typeof RESET_BRANCH | typeof VALIDATE_BRANCH | typeof SET_TREE_VALUE | typeof ARRAY_APPEND | typeof ARRAY_REMOVE | typeof ARRAY_INSERT | typeof ARRAY_MOVE | typeof ARRAY_SWAP | typeof ARRAY_SORT | typeof RESET_FORM | typeof SUBMIT | typeof SUBMIT_SUCCESS | typeof SUBMIT_FAILURE;
interface ActionContext {
    type: ActionType;
    path?: string | undefined;
    value?: unknown;
    index?: number | undefined;
    from?: number | undefined;
    to?: number | undefined;
    permutation?: number[] | undefined;
    options?: DispatchOptions | undefined;
}
type Dispatch = (ctx: ActionContext) => void;
/** Enhancer: receives context, previous state, accumulated draft; returns enriched draft */
type Enhancer<TValues, TError = string> = (ctx: ActionContext, prev: FormState<TValues, TError>, draft: Partial<FormState<TValues, TError>>) => Partial<FormState<TValues, TError>>;
/** Named enhancer: wraps an Enhancer with a string tag for pipeline manipulation */
interface NamedEnhancer<TValues, TError = string> {
    name: string;
    enhancer: Enhancer<TValues, TError>;
    /** Optional initial state contribution. Applied in pipeline order at form creation time.
     * Can be a partial state object or a function that receives the accumulated state so far
     * and returns a partial patch — mirrors the draft pattern used at dispatch time. */
    initialState?: Partial<FormState<TValues, TError>> | ((state: FormState<TValues, TError>) => Partial<FormState<TValues, TError>>);
}
interface Form<TValues, TError = string> {
    getState: StoreApi<FormState<TValues, TError>>["getState"];
    setState: StoreApi<FormState<TValues, TError>>["setState"];
    subscribe: StoreApi<FormState<TValues, TError>>["subscribe"];
    getInitialState: StoreApi<FormState<TValues, TError>>["getInitialState"];
    field: FieldNamespace<TValues, TError>;
    fieldArray: FieldArrayNamespace<TValues, TError>;
    tree: TreeNamespace<TValues, TError>;
    getValues(): TValues;
    reset(nextValues?: Partial<TValues>, options?: DispatchOptions): void;
    handleSubmit(onValid: (values: TValues) => void | Record<string, TError> | Promise<void | Record<string, TError>>, onInvalid?: (errors: Record<string, TError>) => void): (e?: Event) => void | Promise<void>;
    isSubmitting(): boolean;
    submitCount(): number;
    isSubmitSuccessful(): boolean;
    registerField(path: string, entry: FieldValidatorEntry<TError>): void;
    unregisterField(path: string): void;
    select: FormSelectors<TValues, TError>;
}

export { type ActionContext as A, type Dispatch as D, type Enhancer as E, type FormState as F, type InputProps as I, type NamedEnhancer as N, type Path as P, type TreeNamespace as T, type FormResolver as a, type FieldValidateMode as b, type Form as c, type FieldValidatorEntry as d, type ActionType as e, actions as f, type ArrayElement as g, type DeepLeaf as h, type DispatchOptions as i, type FieldArrayItem as j, type FieldArrayNamespace as k, type FieldNamespace as l, type FieldState as m, type FormSelectors as n, type PathValue as o };
