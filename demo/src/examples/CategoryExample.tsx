import type { FormStore } from "../formConfig";
import EntitySelect from "../components/EntitySelect";
import DemoExample from "../components/DemoExample";

export default function CategoryExample({ form }: { form: FormStore }) {
  return (
    <DemoExample
      title="Entity select (object value)"
      code={`const { field, fieldState } = useZField(form, "category");

const selected = field.value as Category | null;
const handleChange = (e) => {
  const entity = CATEGORIES.find(c => c.id === e.target.value);
  field.onChange(entity ?? null);
};`}
      description="The field stores a full entity object (not just an id). useZField treats it as an opaque value — dirty comparison uses deep equality. The resolver validates the whole object (category required)."
    >
      <EntitySelect form={form} path="category" label="Category" />
    </DemoExample>
  );
}
