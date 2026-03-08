import { memo, useRef } from "react";
import { useField } from "zform/react";
import type { UseFieldOptions } from "zform/react";
import type { FormStore } from "../formConfig";
import FieldWrapper from "./FieldWrapper";

const TextField = memo(function TextField({
  form,
  path,
  label,
  type = "text",
  validate,
  asyncValidate,
  asyncValidateMode,
  debounce,
  placeholder,
}: {
  form: FormStore;
  path: string;
  label: string;
  type?: string;
  validate?: UseFieldOptions["validate"];
  asyncValidate?: UseFieldOptions["asyncValidate"];
  asyncValidateMode?: UseFieldOptions["asyncValidateMode"];
  debounce?: number;
  placeholder?: string;
}) {
  const options: UseFieldOptions | undefined =
    validate || asyncValidate || debounce
      ? { validate, asyncValidate, asyncValidateMode, debounce }
      : undefined;
  const { field, fieldState } = useField(form, path, options);
  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <FieldWrapper
      label={label}
      error={fieldState.error}
      isDirty={fieldState.dirty}
      isTouched={fieldState.touched}
      isPending={fieldState.pending}
      renderCount={renderCount.current}
    >
      <input
        ref={field.ref as (el: HTMLInputElement | null) => void}
        type={type}
        value={String(field.value ?? "")}
        onChange={(e) => field.onChange(e.target.value)}
        onFocus={field.onFocus}
        onBlur={field.onBlur}
        placeholder={placeholder}
        style={{
          display: "block",
          width: "100%",
          padding: 8,
          marginTop: 4,
          border: fieldState.error ? "1px solid #c00" : "1px solid #ccc",
          borderRadius: 4,
          boxSizing: "border-box",
        }}
      />
    </FieldWrapper>
  );
});

export default TextField;
