import { useZForm } from "zform";
import { defaultValues, resolver, sleep } from "./formConfig";
import type { FormValues } from "./formConfig";
import FormActions from "./components/FormActions";
import FormFooter from "./components/FormFooter";
import NameExample from "./examples/NameExample";
import EmailExample from "./examples/EmailExample";
import CategoryExample from "./examples/CategoryExample";
import NestedArrayExample from "./examples/NestedArrayExample";

export default function App() {
  const form = useZForm<FormValues>({ defaultValues, resolver, resolverMode: "onChange" });

  return (
    <>
      <form
        onSubmit={(e) => {
          form.handleSubmit(
            async (values) => {
              await sleep(1000);
              console.log("submit ok", values);
            },
            (errors) => console.log("submit errors", errors),
          )(e.nativeEvent);
        }}
        style={{ maxWidth: 520, margin: "40px auto", fontFamily: "system-ui", paddingBottom: 48 }}
      >
        <h1>zustand-form Demo</h1>
        <p style={{ color: "#666", fontSize: 14 }}>useZForm – single store, declarative layers</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <NameExample form={form} />
          <EmailExample form={form} />
          <CategoryExample form={form} />
          <NestedArrayExample form={form} />
          <FormActions form={form} />
        </div>
      </form>
      <FormFooter form={form} />
    </>
  );
}
