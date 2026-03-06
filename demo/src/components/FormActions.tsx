import type { FormStore } from "../formConfig";

export default function FormActions({ form }: { form: FormStore }) {
  const isSubmitting = form((s) => s.isSubmitting);
  const submitCount = form((s) => s.submitCount);
  const isSubmitSuccessful = form((s) => s.isSubmitSuccessful);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <button type="submit" disabled={isSubmitting} style={{ padding: 8 }}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
      <button type="button" onClick={() => form.reset()} style={{ padding: 8 }}>
        Reset
      </button>
      <span style={{ fontSize: 12, color: "#666" }}>
        submitCount: {submitCount} · isSubmitSuccessful: {String(isSubmitSuccessful)}
      </span>
    </div>
  );
}
