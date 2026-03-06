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
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  form: FormStore;
  sectionIndex: number;
  itemIndex: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const path = `sections.${sectionIndex}.items.${itemIndex}.label`;
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
        <button type="button" style={btnStyle} disabled={isFirst} onClick={onMoveUp} title="Move up">↑</button>
        <button type="button" style={btnStyle} disabled={isLast} onClick={onMoveDown} title="Move down">↓</button>
        <button type="button" style={dangerBtn} onClick={onRemove} title="Remove">✕</button>
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
function SectionBlock({
  form,
  sectionIndex,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  form: FormStore;
  sectionIndex: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const itemsPath = `sections.${sectionIndex}.items`;
  const { fields: items, append: appendItem, remove: removeItem, move: moveItem } =
    useZFieldArray<FormValues>(form, itemsPath);

  return (
    <div style={{ border: "1px dashed #ccc", borderRadius: 6, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <SectionTitleField form={form} sectionIndex={sectionIndex} />
        </div>
        <button type="button" style={btnStyle} disabled={isFirst} onClick={onMoveUp} title="Move section up">↑</button>
        <button type="button" style={btnStyle} disabled={isLast} onClick={onMoveDown} title="Move section down">↓</button>
        <button type="button" style={dangerBtn} onClick={onRemove} title="Remove section">✕ Section</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 16 }}>
        {(items as unknown[]).map((_item, idx) => (
          <ItemField
            key={idx}
            form={form}
            sectionIndex={sectionIndex}
            itemIndex={idx}
            onRemove={() => removeItem(idx)}
            onMoveUp={() => moveItem(idx, idx - 1)}
            onMoveDown={() => moveItem(idx, idx + 1)}
            isFirst={idx === 0}
            isLast={idx === items.length - 1}
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
}

// ---------------------------------------------------------------------------
// Main example
// ---------------------------------------------------------------------------
export default function NestedArrayExample({ form }: { form: FormStore }) {
  const { fields: sections, append: appendSection, remove: removeSection, move: moveSection } =
    useZFieldArray<FormValues>(form, "sections");

  return (
    <DemoExample
      title="Nested arrays — sections[].items[].label"
      code={`const { fields, append, remove, move } = useZFieldArray(form, "sections");
const { fields: items } = useZFieldArray(form, \`sections.\${i}.items\`);
const { field, fieldState } = useZField(form, \`sections.\${i}.items.\${j}.label\`);`}
      description={
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Two-level <code>useZFieldArray</code>: sections and items</li>
          <li><strong>Add / Remove / Move up-down</strong> on both sections and items</li>
          <li><strong>Resolver</strong> validates all titles and labels dynamically</li>
          <li><strong>Async validate</strong> on section titles — type <code>duplicate</code></li>
        </ul>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(sections as unknown[]).map((_sec, idx) => (
          <SectionBlock
            key={idx}
            form={form}
            sectionIndex={idx}
            onRemove={() => removeSection(idx)}
            onMoveUp={() => moveSection(idx, idx - 1)}
            onMoveDown={() => moveSection(idx, idx + 1)}
            isFirst={idx === 0}
            isLast={idx === sections.length - 1}
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
