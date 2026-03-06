import type { ReactNode } from "react";

export default function DemoExample({
  title,
  code,
  description,
  children,
}: {
  title: string;
  code: string;
  description?: ReactNode;
  children: ReactNode;
}) {
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
      <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
      <pre
        style={{
          background: "#1e1e2e",
          color: "#cdd6f4",
          padding: 12,
          borderRadius: 6,
          fontSize: 12,
          fontFamily: "monospace",
          overflow: "auto",
          margin: 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {code}
      </pre>
      {description && <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{description}</div>}
      {children}
    </div>
  );
}
