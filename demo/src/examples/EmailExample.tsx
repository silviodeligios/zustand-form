import { validateEmailSync, checkEmailAvailability } from "../formConfig";
import type { FormStore } from "../formConfig";
import AsyncTextField from "../components/AsyncTextField";
import DemoExample from "../components/DemoExample";

export default function EmailExample({ form }: { form: FormStore }) {
  return (
    <DemoExample title="Async field validation + debounce">
      <AsyncTextField
        form={form}
        path="email"
        label="Email"
        type="email"
        validate={validateEmailSync}
        asyncValidate={checkEmailAvailability}
        debounce={1000}
        exampleValues={["taken@example.com"]}
      />
    </DemoExample>
  );
}
