import { useCallback, useState } from "react";
import type { UseZFieldOptions } from "zform/react";
import type { FormStore } from "../formConfig";
import TextField from "./TextField";

export default function AsyncTextField({
  form,
  path,
  label,
  type,
  validate,
  asyncValidate: asyncValidateProp,
  debounce,
  placeholder,
  exampleValues,
}: {
  form: FormStore;
  path: string;
  label: string;
  type?: string;
  validate?: UseZFieldOptions["validate"];
  asyncValidate: (value: any) => Promise<string | undefined>;
  debounce: number;
  placeholder?: string;
  exampleValues?: string[];
}) {
  const [isCalling, setIsCalling] = useState(false);

  const asyncValidate = useCallback(
    (value: unknown) => {
      setIsCalling(true);
      return asyncValidateProp(value).finally(() => {
        setIsCalling(false);
      });
    },
    [asyncValidateProp],
  );

  const pending = form(form.field.select.pending(path));

  const status = pending
    ? isCalling ? "calling API" : "debouncing"
    : "sleeping";

  return (
    <div>
      <TextField
        form={form}
        path={path}
        label={label}
        type={type}
        validate={validate}
        asyncValidate={asyncValidate}
        debounce={debounce}
        placeholder={placeholder}
      />
      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
        Async validation status: {status === "debouncing" ? "⏳" : status === "calling API" ? "📡" : "💤"} {status}
        {exampleValues && (
          <span style={{ marginLeft: 8, color: "#999" }}>
            try: {exampleValues.map((v, i) => (
              <span key={v}>{i > 0 && ", "}<code>{v}</code></span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
