import { memo } from "react";
import { useZFieldArray } from "zform";
import { checkSectionTitleUniqueness } from "../formConfig";
import type { FormValues, FormStore } from "../formConfig";
import TextField from "../components/TextField";
import AsyncTextField from "../components/AsyncTextField";
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
// Item row: TextField + array action buttons
// ---------------------------------------------------------------------------
const ItemRow = memo(function ItemRow({
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

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <TextField form={form} path={path} label={`Item [${sectionIndex}][${itemIndex}]`} />
      </div>
      <button type="button" style={btnStyle} disabled={isFirst} onClick={() => form.fieldArray.move(itemsPath, itemIndex, itemIndex - 1)} title="Move up">↑</button>
      <button type="button" style={btnStyle} disabled={isLast} onClick={() => form.fieldArray.move(itemsPath, itemIndex, itemIndex + 1)} title="Move down">↓</button>
      <button type="button" style={dangerBtn} onClick={() => form.fieldArray.remove(itemsPath, itemIndex)} title="Remove">✕</button>
    </div>
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
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <AsyncTextField
            form={form}
            path={`sections.${sectionIndex}.title`}
            label={`Section [${sectionIndex}] title`}
            asyncValidate={checkSectionTitleUniqueness}
            debounce={800}
            exampleValues={["duplicate"]}
          />
        </div>
        <button type="button" style={btnStyle} disabled={isFirst} onClick={() => form.fieldArray.move("sections", sectionIndex, sectionIndex - 1)} title="Move section up">↑</button>
        <button type="button" style={btnStyle} disabled={isLast} onClick={() => form.fieldArray.move("sections", sectionIndex, sectionIndex + 1)} title="Move section down">↓</button>
        <button type="button" style={dangerBtn} onClick={() => form.fieldArray.remove("sections", sectionIndex)} title="Remove section">✕ Section</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 16 }}>
        {items.map((item) => (
          <ItemRow
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
