import type { FormStore } from "../formConfig";

function getLeafPaths(obj: unknown, prefix = ""): string[] {
  if (obj == null || typeof obj !== "object") return prefix ? [prefix] : [];
  if (Array.isArray(obj)) {
    return obj.flatMap((item, i) => getLeafPaths(item, prefix ? `${prefix}.${i}` : `${i}`));
  }
  const record = obj as Record<string, unknown>;
  return Object.keys(record).flatMap((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const val = record[key];
    if (val == null || typeof val !== "object") return [path];
    return getLeafPaths(val, path);
  });
}

export default function FormFooter({ form }: { form: FormStore }) {
  const { focused, paths } = form((s) => {
    const focused = s.focusedField;
    const values = s.values as Record<string, unknown>;
    const { category, ...valuesWithoutCategory } = values;
    const pathsFromRest = getLeafPaths(valuesWithoutCategory);
    const allPaths = [...pathsFromRest, "category"];
    return { focused, paths: allPaths };
  });

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "8px 16px",
        background: "#1e1e2e",
        color: "#cdd6f4",
        fontFamily: "monospace",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 12,
        zIndex: 9999,
      }}
    >
      <span>focused:</span>
      <select
        value={focused ?? ""}
        onChange={(e) => {
          if (e.target.value) form.field.focus(e.target.value);
        }}
        style={{
          background: "#313244",
          color: "#cdd6f4",
          border: "1px solid #45475a",
          borderRadius: 4,
          padding: "4px 8px",
          fontFamily: "monospace",
          fontSize: 13,
        }}
      >
        <option value="">none</option>
        {paths.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
}
