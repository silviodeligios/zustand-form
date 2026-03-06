# zForm

A React form library built on [Zustand](https://github.com/pmndrs/zustand). The form **is** a zustand vanilla store with a layered action pipeline — each concern (values, dirty, touched, validation, pending, submit) is a self-contained enhancer. A single `dispatch` runs every enhancer and commits the result in one atomic `setState`.

## Architecture

```
React layer
  useZForm (callable selector) · useZField · useZFieldArray

API (vanilla, framework-agnostic)
  form.field(path) · form.tree(path?) · form-level methods

Action pipeline (dispatch -> enhancers -> setState)
  values · touched · dirty · validation · schemaValidation · asyncValidation · pending · submit

zustand vanilla store
  getState · subscribe · setState · devtools
```

When an action is dispatched, every enhancer runs in order against the same `prev` snapshot. Each enhancer reads what previous layers wrote in the `draft`. At the end, one `store.setState(draft)` commits everything atomically — no intermediate states, one subscription notification, one React render.

## Quick start

```tsx
import { useZForm, useZField } from "zform";

function App() {
  const form = useZForm<FormValues>({
    defaultValues: { name: "", email: "" },
    resolver: myResolver,
    resolverMode: "onChange",
  });

  return (
    <form onSubmit={(e) => {
      form.handleSubmit(
        async (values) => await saveToServer(values),
        (errors) => console.log("invalid", errors),
      )(e.nativeEvent);
    }}>
      <NameField form={form} />
      <EmailField form={form} />
      <button type="submit">Save</button>
    </form>
  );
}
```

## `useZField` — bind a field

Returns `{ field, fieldState }` like React Hook Form's `useController`.

```tsx
function NameField({ form }) {
  const { field, fieldState } = useZField(form, "name");

  return (
    <div>
      <input
        value={field.value}
        onChange={(e) => field.onChange(e.target.value)}
        onFocus={field.onFocus}
        onBlur={field.onBlur}
        ref={field.ref}
      />
      {fieldState.error && <span>{fieldState.error}</span>}
      {fieldState.dirty && <span>(modified)</span>}
    </div>
  );
}
```

## Field-level validation

`useZField` accepts sync and async validators. Sync runs first; async only fires if sync passes and the field is dirty.

```tsx
const { field, fieldState } = useZField(form, "email", {
  validate: (v) => (!String(v).includes("@") ? "Must contain @" : undefined),
  validateMode: "onChange",
  asyncValidate: (v) => checkEmailAvailability(v),
  asyncValidateMode: "onChange",
  debounce: 1000,
});
```

## Schema validation (resolver)

A `FormResolver` validates one field at a time, running after per-field validators. If a field already has an error from its own validator, the resolver is skipped for that field.

```ts
const resolver: FormResolver<FormValues> = {
  validateField(path, values) {
    if (path === "name" && !values.name?.trim()) return "Name required";
    if (path === "email" && !values.email?.trim()) return "Email required";
    return undefined;
  },
};

const form = useZForm({ defaultValues, resolver, resolverMode: "onChange" });
```

## Arrays

`useZFieldArray` returns mutation methods that automatically reindex all path-keyed records (dirty, errors, touched, pending).

```tsx
const { fields, append, remove, insert, move } = useZFieldArray(form, "sections");

{fields.map((section, i) => (
  <SectionEditor key={i} index={i} />
))}
```

## `form.field(path)` — field API

Operates on the exact path. No recursion on children.

```ts
const email = form.field("email");

// Imperative getters
email.getValue();   // current value
email.isDirty();    // boolean
email.getError();   // string | undefined

// Setters (dispatch actions)
email.setValue("test@example.com");
email.focus();
email.blur();
email.validate();
email.reset();

// Pre-built selectors for form(selector)
const fieldState = form(email.select.fieldState, shallow);
```

## `form.tree(path?)` — subtree API

Operates on the path and all its descendants. Without arguments, operates on the entire form.

```ts
const items = form.tree("items");

items.isDirty();      // any dirty field under items.*
items.isValid();      // no errors under items.*
items.getErrors();    // all errors under items.*
items.clearErrors();  // remove all errors under items.*

// Pre-built selectors
const errorCount = form(items.select.errorCount);
const isValid = form(form.tree().select.valid);
```

## `FormProvider` + `useFormContext`

Optional context to avoid prop drilling.

```tsx
<FormProvider value={form}>
  <NameField />
</FormProvider>

function NameField() {
  const form = useFormContext();
  const { field, fieldState } = useZField(form, "name");
  // ...
}
```

## It's just a Zustand store

```tsx
// Fine-grained selectors
const email = form((s) => s.values.email);
const isSubmitting = form((s) => s.isSubmitting);

// Imperative read
const snapshot = form.getState();

// Subscribe outside React
form.subscribe((state, prev) => {
  if (state.isSubmitting !== prev.isSubmitting) {
    analytics.track("form_submit");
  }
});

// Devtools — every action shows up as SET_VALUE:email, BLUR:name, etc.
```

## Store state

```ts
type FormState<TValues> = {
  values: TValues
  dirtyFields: Record<string, boolean>
  touchedFields: Record<string, boolean>
  errors: Record<string, string | undefined>
  pendingFields: Record<string, boolean>
  focusedField: string | null
  isSubmitting: boolean
  submitCount: number
  isSubmitSuccessful: boolean
}
```

All path-keyed records use dot-notation (`"items.0.name"`).

## Enhancer pipeline

Each enhancer is a pure function:

```ts
type Enhancer<TValues> = (
  ctx: ActionContext,
  prev: FormState<TValues>,
  draft: Partial<FormState<TValues>>,
) => Partial<FormState<TValues>>
```

The built-in pipeline runs in this order:

1. **values** — sets values, handles array mutations (append, remove, insert, move)
2. **touched** — marks touched on focus, reindexes on array ops
3. **dirty** — compares against defaultValues with deep equality
4. **validation** — per-field sync validators from registry
5. **schemaValidation** — form-level resolver, skips if field already has error
6. **asyncValidation** — async validators with debounce, dirty guard, version-based stale cancellation
7. **pending** — tracks pendingFields lifecycle
8. **submit** — isSubmitting, submitCount, isSubmitSuccessful

## License

MIT
