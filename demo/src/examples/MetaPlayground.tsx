import { shallow } from "zustand/shallow";
import type { FormStore } from "../formConfig";

const btn: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: 12,
  fontFamily: "monospace",
  cursor: "pointer",
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#fafafa",
};

const groupStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  padding: 8,
  border: "1px solid #e0e0e0",
  borderRadius: 6,
};

function BtnGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>{label}</div>
      <div style={groupStyle}>{children}</div>
    </div>
  );
}

export default function MetaPlayground({ form }: { form: FormStore }) {
  const metaValues = form(form.field.select.value("meta"));

  const treeState = form(
    (s) => ({
      dirtyFields: Object.fromEntries(Object.entries(s.dirtyFields).filter(([k]) => k.startsWith("meta"))),
      touchedFields: Object.fromEntries(Object.entries(s.touchedFields).filter(([k]) => k.startsWith("meta"))),
      errors: Object.fromEntries(Object.entries(s.errors).filter(([k]) => k.startsWith("meta"))),
      pendingFields: Object.fromEntries(Object.entries(s.pendingFields).filter(([k]) => k.startsWith("meta"))),
    }),
    shallow,
  );

  const treeSummary = form(
    (s) => {
      const match = (k: string) => k === "meta" || k.startsWith("meta.");
      const keys = Object.keys;
      return {
        isDirty: keys(s.dirtyFields).some((k) => match(k) && s.dirtyFields[k]),
        isTouched: keys(s.touchedFields).some((k) => match(k) && s.touchedFields[k]),
        isPending: keys(s.pendingFields).some((k) => match(k) && s.pendingFields[k]),
        isValid: !keys(s.errors).some((k) => match(k) && s.errors[k] !== undefined),
        errorCount: keys(s.errors).filter((k) => match(k) && s.errors[k] !== undefined).length,
      };
    },
    shallow,
  );

  const snapshot = {
    values: metaValues,
    ...treeState,
    treeSummary,
  };

  let counter = 0;

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 15 }}>Meta Playground — programmatic API</div>

      <pre
        style={{
          background: "#f5f5f5",
          padding: 12,
          borderRadius: 6,
          fontSize: 12,
          overflow: "auto",
          maxHeight: 360,
          margin: 0,
        }}
      >
        {JSON.stringify(snapshot, null, 2)}
      </pre>

      <BtnGroup label="field — scalars">
        <button style={btn} type="button" onClick={() => form.field.setValue("meta.title", `Title ${++counter}`)}>
          setValue title
        </button>
        <button style={btn} type="button" onClick={() => form.field.setValue("meta.enabled", !form.field.getValue("meta.enabled"))}>
          toggle enabled
        </button>
        <button style={btn} type="button" onClick={() => form.field.focus("meta.title")}>
          focus title
        </button>
        <button style={btn} type="button" onClick={() => form.field.blur("meta.title")}>
          blur title
        </button>
        <button style={btn} type="button" onClick={() => form.field.setTouched("meta.title", true)}>
          setTouched title
        </button>
        <button style={btn} type="button" onClick={() => form.field.setDirty("meta.title", true)}>
          setDirty title
        </button>
        <button style={btn} type="button" onClick={() => form.field.setError("meta.title", "Manual error")}>
          setError title
        </button>
        <button style={btn} type="button" onClick={() => form.field.clearError("meta.title")}>
          clearError title
        </button>
        <button style={btn} type="button" onClick={() => form.field.reset("meta.title")}>
          reset title
        </button>
        <button style={btn} type="button" onClick={() => form.field.validate("meta.title")}>
          validate title
        </button>
      </BtnGroup>

      <BtnGroup label="fieldArray — meta.sections">
        <button
          style={btn}
          type="button"
          onClick={() => form.fieldArray.append("meta.sections", { heading: "New", tags: [] })}
        >
          append
        </button>
        <button
          style={btn}
          type="button"
          onClick={() => form.fieldArray.prepend("meta.sections", { heading: "First", tags: [] })}
        >
          prepend
        </button>
        <button
          style={btn}
          type="button"
          onClick={() => form.fieldArray.insert("meta.sections", 1, { heading: "Inserted", tags: [] })}
        >
          insert @1
        </button>
        <button style={btn} type="button" onClick={() => form.fieldArray.remove("meta.sections", 0)}>
          remove @0
        </button>
        <button style={btn} type="button" onClick={() => form.fieldArray.move("meta.sections", 0, 1)}>
          move 0→1
        </button>
        <button style={btn} type="button" onClick={() => form.fieldArray.swap("meta.sections", 0, 1)}>
          swap 0↔1
        </button>
        <button
          style={btn}
          type="button"
          onClick={() => form.fieldArray.replace("meta.sections", [{ heading: "Replaced", tags: [] }])}
        >
          replace all
        </button>
      </BtnGroup>

      <BtnGroup label="fieldArray — meta.sections.0.tags">
        <button
          style={btn}
          type="button"
          onClick={() => form.fieldArray.append("meta.sections.0.tags", { label: "tag", value: "v" })}
        >
          append tag
        </button>
        <button style={btn} type="button" onClick={() => form.fieldArray.remove("meta.sections.0.tags", 0)}>
          remove tag @0
        </button>
      </BtnGroup>

      <BtnGroup label="tree — meta subtree">
        <button style={btn} type="button" onClick={() => alert(`isDirty: ${form.tree.isDirty("meta")}`)}>
          isDirty
        </button>
        <button style={btn} type="button" onClick={() => alert(`isTouched: ${form.tree.isTouched("meta")}`)}>
          isTouched
        </button>
        <button style={btn} type="button" onClick={() => alert(`isPending: ${form.tree.isPending("meta")}`)}>
          isPending
        </button>
        <button style={btn} type="button" onClick={() => alert(`isValid: ${form.tree.isValid("meta")}`)}>
          isValid
        </button>
        <button
          style={btn}
          type="button"
          onClick={() => alert(`errors: ${JSON.stringify(form.tree.getErrors("meta"))}`)}
        >
          getErrors
        </button>
        <button
          style={btn}
          type="button"
          onClick={() => alert(`dirtyFields: ${JSON.stringify(form.tree.getDirtyFields("meta"))}`)}
        >
          getDirtyFields
        </button>
        <button
          style={btn}
          type="button"
          onClick={() => alert(`touchedFields: ${JSON.stringify(form.tree.getTouchedFields("meta"))}`)}
        >
          getTouchedFields
        </button>
        <button style={btn} type="button" onClick={() => form.tree.clearErrors("meta")}>
          clearErrors
        </button>
        <button style={btn} type="button" onClick={() => form.tree.reset("meta")}>
          reset
        </button>
        <button style={btn} type="button" onClick={() => form.tree.validate("meta")}>
          validate
        </button>
      </BtnGroup>
    </div>
  );
}
