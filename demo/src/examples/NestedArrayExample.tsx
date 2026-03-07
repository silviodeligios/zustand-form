import { memo, useCallback, useRef, useState } from "react";
import { useZField, useZFieldArray } from "zform";
import { checkSectionTitleUniqueness } from "../formConfig";
import type { FormValues, FormStore } from "../formConfig";
import FieldWrapper from "../components/FieldWrapper";
import DemoExample from "../components/DemoExample";

const btnStyle: React.CSSProperties = {
  padding: "2px 8px",
  fontSize: 12,
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
};
const dangerBtn: React.CSSProperties = { ...btnStyle, color: "#c00", borderColor: "#c00" };

// ---------------------------------------------------------------------------
// Item label field
// ---------------------------------------------------------------------------
const ItemField = memo(function ItemField({
  form,
  sectionIndex,
  itemIndex,
  isFirst,
  isLast,
}: {
  form: FormStore;
  sectionIndex: number;
  itemIndex: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const itemsPath = `sections.${sectionIndex}.items`;
  const path = `${itemsPath}.${itemIndex}.label`;
  const { field, fieldState } = useZField(form, path);

  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <FieldWrapper
      label={`Item [${sectionIndex}][${itemIndex}]`}
      error={fieldState.error}
      isDirty={fieldState.dirty}
      isTouched={fieldState.touched}
      isPending={fieldState.pending}
      renderCount={renderCount.current}
    >
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        <input
          ref={field.ref as (el: HTMLInputElement | null) => void}
          type="text"
          value={String(field.value ?? "")}
          onChange={(e) => field.onChange(e.target.value)}
          onFocus={field.onFocus}
          onBlur={field.onBlur}
          style={{
            flex: 1,
            padding: 8,
            border: fieldState.error ? "1px solid #c00" : "1px solid #ccc",
            borderRadius: 4,
            boxSizing: "border-box",
          }}
        />
        <button type="button" style={btnStyle} disabled={isFirst} onClick={() => form.fieldArray.move(itemsPath, itemIndex, itemIndex - 1)} title="Move up">↑</button>
        <button type="button" style={btnStyle} disabled={isLast} onClick={() => form.fieldArray.move(itemsPath, itemIndex, itemIndex + 1)} title="Move down">↓</button>
        <button type="button" style={dangerBtn} onClick={() => form.fieldArray.remove(itemsPath, itemIndex)} title="Remove">✕</button>
      </div>
    </FieldWrapper>
  );
});

// ---------------------------------------------------------------------------
// Section title field
// ---------------------------------------------------------------------------
const SectionTitleField = memo(function SectionTitleField({
  form,
  sectionIndex,
}: {
  form: FormStore;
  sectionIndex: number;
}) {
  const path = `sections.${sectionIndex}.title`;
  const [isCalling, setIsCalling] = useState(false);

  const asyncValidate = useCallback(
    async (value: unknown) => {
      setIsCalling(true);
      const result = await checkSectionTitleUniqueness(value as string);
      setIsCalling(false);
      return result;
    },
    [],
  );

  const { field, fieldState } = useZField(form, path, { asyncValidate, debounce: 800 });

  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <FieldWrapper
      label={`Section [${sectionIndex}] title`}
      error={fieldState.error}
      isDirty={fieldState.dirty}
      isTouched={fieldState.touched}
      isPending={fieldState.pending}
      isCalling={isCalling}
      renderCount={renderCount.current}
    >
      <input
        ref={field.ref as (el: HTMLInputElement | null) => void}
        type="text"
        value={String(field.value ?? "")}
        onChange={(e) => field.onChange(e.target.value)}
        onFocus={field.onFocus}
        onBlur={field.onBlur}
        placeholder='try "duplicate"'
        style={{
          display: "block",
          width: "100%",
          padding: 8,
          marginTop: 4,
          border: fieldState.error ? "1px solid #c00" : "1px solid #ccc",
          borderRadius: 4,
          boxSizing: "border-box",
          fontWeight: 600,
        }}
      />
    </FieldWrapper>
  );
});

// ---------------------------------------------------------------------------
// Section block
// ---------------------------------------------------------------------------
const SectionBlock = memo(function SectionBlock({
  form,
  sectionIndex,
  isFirst,
  isLast,
}: {
  form: FormStore;
  sectionIndex: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const itemsPath = `sections.${sectionIndex}.items`;
  const { fields: items, append: appendItem } =
    useZFieldArray<FormValues>(form, itemsPath);

  return (
    <div style={{ border: "1px dashed #ccc", borderRadius: 6, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <SectionTitleField form={form} sectionIndex={sectionIndex} />
        </div>
        <button type="button" style={btnStyle} disabled={isFirst} onClick={() => form.fieldArray.move("sections", sectionIndex, sectionIndex - 1)} title="Move section up">↑</button>
        <button type="button" style={btnStyle} disabled={isLast} onClick={() => form.fieldArray.move("sections", sectionIndex, sectionIndex + 1)} title="Move section down">↓</button>
        <button type="button" style={dangerBtn} onClick={() => form.fieldArray.remove("sections", sectionIndex)} title="Remove section">✕ Section</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 16 }}>
        {items.map((item) => (
          <ItemField
            key={item.id}
            form={form}
            sectionIndex={sectionIndex}
            itemIndex={item.index}
            isFirst={item.index === 0}
            isLast={item.index === items.length - 1}
          />
        ))}
        <button
          type="button"
          onClick={() => appendItem({ label: "" })}
          style={{ ...btnStyle, alignSelf: "flex-start", color: "#059669", borderColor: "#059669" }}
        >
          + Add item
        </button>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main example
// ---------------------------------------------------------------------------
export default function NestedArrayExample({ form }: { form: FormStore }) {
  const { fields: sections, append: appendSection } =
    useZFieldArray<FormValues>(form, "sections");

  return (
    <DemoExample title="Nested arrays — sections[].items[].label">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sections.map((sec) => (
          <SectionBlock
            key={sec.id}
            form={form}
            sectionIndex={sec.index}
            isFirst={sec.index === 0}
            isLast={sec.index === sections.length - 1}
          />
        ))}
        <button
          type="button"
          onClick={() => appendSection({ title: "", items: [{ label: "" }] })}
          style={{ ...btnStyle, alignSelf: "flex-start", color: "#2563eb", borderColor: "#2563eb", padding: "6px 12px" }}
        >
          + Add section
        </button>
      </div>
    </DemoExample>
  );
}
