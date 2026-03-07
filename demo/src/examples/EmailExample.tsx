import { memo, useCallback, useRef, useState } from "react";
import { useZField } from "zform";
import { validateEmailSync, checkEmailAvailability } from "../formConfig";
import type { FormStore } from "../formConfig";
import FieldWrapper from "../components/FieldWrapper";
import DemoExample from "../components/DemoExample";

const EmailField = memo(function EmailField({ form }: { form: FormStore }) {
  const [isCalling, setIsCalling] = useState(false);
  const [serverRequests, setServerRequests] = useState(0);

  const asyncValidate = useCallback((value: unknown) => {
    setIsCalling(true);
    setServerRequests((prev) => prev + 1);
    return checkEmailAvailability(value as string).finally(() => {
      setIsCalling(false);
    });
  }, []);

  const { field, fieldState } = useZField(form, "email", {
    validate: validateEmailSync,
    asyncValidate,
    debounce: 1000,
  });

  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <FieldWrapper
      label="Email"
      error={fieldState.error}
      isDirty={fieldState.dirty}
      isTouched={fieldState.touched}
      isPending={fieldState.pending}
      isCalling={isCalling}
      renderCount={renderCount.current}
    >
      <input
        ref={field.ref as (el: HTMLInputElement | null) => void}
        type="email"
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
      {serverRequests > 0 && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Server requests: {serverRequests}</div>}
    </FieldWrapper>
  );
});

export default function EmailExample({ form }: { form: FormStore }) {
  return (
    <DemoExample title="Async field validation + debounce">
      <EmailField form={form} />
    </DemoExample>
  );
}
