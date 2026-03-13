import type { FormStore } from "../formConfig";
import { sleep } from "../formConfig";

export default function FormActions({ form }: { form: FormStore }) {
  const isSubmitting = form((s) => s.isSubmitting);
  const submitCount = form((s) => s.submitCount);
  const isSubmitSuccessful = form((s) => s.isSubmitSuccessful);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <button type="submit" disabled={isSubmitting} style={{ padding: 8 }}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
      <button
        type="button"
        disabled={isSubmitting}
        style={{ padding: 8 }}
        onClick={() => {
          form.handleSubmit(
            async () => {
              await sleep(500);
              return { name: "Server: name already taken", email: "Server: email already used" };
            },
            (errors) => console.log("submit errors", errors),
          )();
        }}
      >
        Submit with error
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
