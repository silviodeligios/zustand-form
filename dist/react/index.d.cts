import { c as Form, F as FormState, i as FieldArrayItem, l as FieldState, h as DispatchOptions, d as FieldValidatorEntry, I as InputProps, a as FormResolver, b as FieldValidateMode, N as NamedEnhancer, P as Path, n as PathValue, g as ArrayElement } from '../types-Di8DXReF.cjs';
import { StateCreator } from 'zustand/vanilla';
import * as react from 'react';

/** Form callable as React selector hook + vanilla Form methods */
interface FormHook<TValues, TError = string> extends Form<TValues, TError> {
    <U>(selector: (state: FormState<TValues, TError>) => U, equalityFn?: (a: U, b: U) => boolean): U;
}
/** Options for useField — per-field validation + registration */
interface UseFieldOptions<TError = string, TValue = unknown> {
    validate?: FieldValidatorEntry<TError, TValue>["validate"];
    validateMode?: FieldValidatorEntry<TError>["validateMode"];
    asyncValidate?: FieldValidatorEntry<TError, TValue>["asyncValidate"];
    asyncValidateMode?: FieldValidatorEntry<TError>["asyncValidateMode"];
    debounce?: FieldValidatorEntry<TError>["debounce"];
}
/** Return type of useField */
interface UseFieldReturn<TError = string, TValue = unknown> {
    field: InputProps<TValue> & {
        ref: (el: HTMLElement | null) => void;
    };
    fieldState: FieldState<TError>;
}
/** Return type of useFieldArray */
interface UseFieldArrayReturn<TError = string, TElement = unknown> {
    fields: FieldArrayItem[];
    fieldState: FieldState<TError>;
    append(value: TElement, options?: DispatchOptions): void;
    prepend(value: TElement, options?: DispatchOptions): void;
    remove(index: number, options?: DispatchOptions): void;
    insert(index: number, value: TElement, options?: DispatchOptions): void;
    move(from: number, to: number, options?: DispatchOptions): void;
    swap(indexA: number, indexB: number, options?: DispatchOptions): void;
    replace(arr: TElement[], options?: DispatchOptions): void;
}

interface UseFormConfig<TValues, TError = string> {
    defaultValues: TValues;
    resolver?: FormResolver<TValues, TError>;
    resolverMode?: FieldValidateMode;
    enhancers?: (defaults: NamedEnhancer<TValues, TError>[]) => NamedEnhancer<TValues, TError>[];
    middleware?: (initializer: StateCreator<FormState<TValues, TError>>) => StateCreator<FormState<TValues, TError>, any, any>;
}
declare function useForm<TValues, TError = string>(config: UseFormConfig<TValues, TError>): FormHook<TValues, TError>;

declare function useField<TValues, TError = string, P extends Path<TValues> = Path<TValues>>(form: FormHook<TValues, TError>, path: P, options?: UseFieldOptions<TError, PathValue<TValues, P>>): UseFieldReturn<TError, PathValue<TValues, P>>;
declare function useField<TError = string>(path: string, options?: UseFieldOptions<TError>): UseFieldReturn<TError>;

declare function useWatch<TValues, TError = string, P extends Path<TValues> = Path<TValues>>(form: FormHook<TValues, TError>, path: P): PathValue<TValues, P>;
declare function useWatch(path: string): unknown;

declare function useFieldValidation<TValues, TError = string, P extends Path<TValues> = Path<TValues>>(form: FormHook<TValues, TError>, path: P, options?: UseFieldOptions<TError, PathValue<TValues, P>>): void;
declare function useFieldValidation<TError = string>(path: string, options?: UseFieldOptions<TError>): void;

declare function useFieldArray<TValues, TError = string, P extends Path<TValues> = Path<TValues>>(form: FormHook<TValues, TError>, path: P, options?: UseFieldOptions<TError, PathValue<TValues, P>>): UseFieldArrayReturn<TError, ArrayElement<PathValue<TValues, P>>>;
declare function useFieldArray(path: string, options?: UseFieldOptions): UseFieldArrayReturn;

declare const FormProvider: react.Provider<FormHook<any, any> | null>;
declare function useFormContext<TValues, TError = string>(): FormHook<TValues, TError>;

export { type FormHook, FormProvider, type UseFieldArrayReturn, type UseFieldOptions, type UseFieldReturn, type UseFormConfig, useField, useFieldArray, useFieldValidation, useForm, useFormContext, useWatch };
