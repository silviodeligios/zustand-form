import type { FormStore } from "../formConfig";
import EntitySelect from "../components/EntitySelect";
import DemoExample from "../components/DemoExample";

export default function CategoryExample({ form }: { form: FormStore }) {
  return (
    <DemoExample title="Entity select (object value)">
      <EntitySelect form={form} path="category" label="Category" />
    </DemoExample>
  );
}
