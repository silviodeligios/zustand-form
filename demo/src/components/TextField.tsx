import { memo, useRef } from "react";
import { useZField } from "zform";
import type { UseZFieldOptions } from "zform";
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
}: {
  form: FormStore;
  path: string;
  label: string;
  type?: string;
  validate?: UseZFieldOptions["validate"];
  asyncValidate?: UseZFieldOptions["asyncValidate"];
  asyncValidateMode?: UseZFieldOptions["asyncValidateMode"];
  debounce?: number;
}) {
  const options: UseZFieldOptions | undefined =
    validate || asyncValidate || debounce
      ? { validate, asyncValidate, asyncValidateMode, debounce }
      : undefined;
  const { field, fieldState } = useZField(form, path, options);
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
