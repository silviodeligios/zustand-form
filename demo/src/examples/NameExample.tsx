import type { FormStore } from "../formConfig";
import TextField from "../components/TextField";
import DemoExample from "../components/DemoExample";

export default function NameExample({ form }: { form: FormStore }) {
  return (
    <DemoExample title="Sync validation (resolver)">
      <TextField form={form} path="name" label="Name" />
    </DemoExample>
  );
}
