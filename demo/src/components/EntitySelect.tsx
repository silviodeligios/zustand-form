import { memo, useCallback, useRef } from "react";
import { useField } from "zform/react";
import type { FormStore, Category } from "../formConfig";
import { CATEGORIES } from "../formConfig";
import FieldWrapper from "./FieldWrapper";

const EntitySelect = memo(function EntitySelect({
  form,
  path,
  label,
}: {
  form: FormStore;
  path: string;
  label: string;
}) {
  const { field, fieldState } = useField(form, path);
  const renderCount = useRef(0);
  renderCount.current++;

  const selected = field.value as Category | null;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      const entity = id ? CATEGORIES.find((c) => c.id === id) ?? null : null;
      field.onChange(entity);
    },
    [field.onChange],
  );

  return (
    <FieldWrapper
      label={label}
      error={fieldState.error}
      isDirty={fieldState.dirty}
      isTouched={fieldState.touched}
      isPending={fieldState.pending}
      renderCount={renderCount.current}
    >
      <select
        ref={field.ref as (el: HTMLSelectElement | null) => void}
        value={selected?.id ?? ""}
        onChange={handleChange}
        onBlur={field.onBlur}
        onFocus={field.onFocus}
        style={{
          display: "block",
          width: "100%",
          padding: 8,
          marginTop: 4,
          border: fieldState.error ? "1px solid #c00" : "1px solid #ccc",
          borderRadius: 4,
          boxSizing: "border-box",
        }}
      >
        <option value="">— Select —</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      {selected && (
        <div style={{ fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: selected.color,
            }}
          />
          {selected.name} (id: {selected.id})
        </div>
      )}
    </FieldWrapper>
  );
});

export default EntitySelect;
