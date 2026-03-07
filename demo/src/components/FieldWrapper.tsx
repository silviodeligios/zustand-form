import type { ReactNode } from "react";

export default function FieldWrapper({
  label,
  error,
  isDirty,
  isTouched,
  isPending,
  renderCount,
  children,
}: {
  label: string;
  error: string | undefined;
  isDirty: boolean;
  isTouched: boolean;
  isPending: boolean;
  renderCount: number;
  children: ReactNode;
}) {
  return (
    <div>
      <label style={{ display: "block", fontWeight: 500, fontSize: 14 }}>
        {label}
        {children}
      </label>
      {error && <div style={{ fontSize: 12, color: "#c00", marginTop: 4 }}>❌ {error}</div>}
      <div style={{ fontSize: 12, color: "#888", marginTop: 4, display: "flex", gap: 8 }}>
        <span>{isDirty ? "✏️" : "⬜"} dirty</span>
        <span>{isTouched ? "👆" : "⬜"} touched</span>
        <span>{isPending ? "⏳" : "⬜"} pending</span>
        <span>🔄 renders: {renderCount}</span>
      </div>
    </div>
  );
}
