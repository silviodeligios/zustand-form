# zForm

A React form library built on [Zustand](https://github.com/pmndrs/zustand). The form **is** a zustand vanilla store with a layered action pipeline — each concern (values, dirty, touched, validation, pending, submit) is a self-contained enhancer. A single `dispatch` runs every enhancer and commits the result in one atomic `setState`.

## Architecture

```
React layer
  useZForm (callable selector) · useZField · useZFieldArray · FormProvider

API (vanilla, framework-agnostic)
  form.field.method(path) · form.tree.method(path?) · form-level methods

Action pipeline (dispatch -> enhancers -> setState)
  values · touched · dirty · validation · schemaValidation · asyncValidation · pending · submit

zustand vanilla store
  getState · subscribe · setState · devtools
```

When an action is dispatched, every enhancer runs in order against the same `prev` snapshot. Each enhancer reads what previous layers wrote in the `draft`. At the end, one `store.setState(draft)` commits everything atomically — no intermediate states, one subscription notification, one React render.

## Quick start

```tsx
import { useZForm, useZField, FormProvider } from "zform";
import { devtools } from "zustand/middleware";

function App() {
  const form = useZForm<FormValues>({
    defaultValues: { name: "", email: "" },
    resolver: myResolver,
    resolverMode: "onChange",
    middleware: (init) => devtools(init, { name: "zustand-form" }),
  });

  return (
    <FormProvider value={form}>
      <form onSubmit={(e) => {
        form.handleSubmit(
          async (values) => await saveToServer(values),
          (errors) => console.log("invalid", errors),
        )(e.nativeEvent);
      }}>
        <NameField />
        <EmailField />
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}
```

## `useZField` — bind a field

Returns `{ field, fieldState }` like React Hook Form's `useController`. Handlers are memoized — child components wrapped in `React.memo` will skip re-renders when only the parent changes.

Both signatures are supported:

```tsx
// Explicit form prop
const { field, fieldState } = useZField(form, "name");

// From context (uses FormProvider)
const { field, fieldState } = useZField("name");
```

When `form` is not passed, `useZField` calls `useFormContext()` internally. If no `FormProvider` is found, it throws.

```tsx
function NameField() {
  const { field, fieldState } = useZField("name");

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

`fieldState` includes: `value`, `dirty`, `touched`, `error`, `pending`, `focused`.

When `form.field.focus(path)` is called programmatically, `useZField` detects the change and calls `el.focus()` on the bound ref automatically.

## Field-level validation

`useZField` accepts sync and async validators as its last argument (with or without the `form` prop):

```tsx
// With explicit form
const { field, fieldState } = useZField(form, "email", {
  validate: (v) => (!String(v).includes("@") ? "Must contain @" : undefined),
  asyncValidate: (v) => checkEmailAvailability(v),
  debounce: 500,
});

// From context
const { field, fieldState } = useZField("email", {
  validate: (v) => (!String(v).includes("@") ? "Must contain @" : undefined),
  asyncValidate: (v) => checkEmailAvailability(v),
  debounce: 500,
});
```

### Validation order and priority

The pipeline runs in this order: **field-level sync → schema resolver → async**. Priority flows top-down:

1. **Field sync** (`validate`) — runs first. If it returns an error, schema and async are both skipped for this field.
2. **Schema** (`resolver.validateField`) — runs if field sync passed. If it returns an error, async is skipped.
3. **Async** (`asyncValidate`) — runs only if both sync and schema passed, and the field is dirty. Sets `pending: true` while in-flight.

When a sync or schema error appears while an async validation is already in-flight, the async is **automatically cancelled**: the pending state is cleared immediately, and the stale async result is discarded when it resolves. This prevents async results from overwriting sync errors.

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `validate` | — | Sync validator: `(value) => string \| undefined` |
| `validateMode` | `"onChange"` | When sync runs: `"onChange"` or `"onBlur"` |
| `asyncValidate` | — | Async validator: `(value) => Promise<string \| undefined>` |
| `asyncValidateMode` | `"onChange"` | When async runs: `"onChange"` or `"onBlur"` |
| `debounce` | — | Debounce delay (ms) before async fires |

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

`useZFieldArray` returns mutation methods that automatically reindex all path-keyed records (dirty, errors, touched, pending). Each item has a stable `id` for React keys and an `index` for path construction.

Both signatures are supported:

```tsx
// Explicit form prop
const { fields, append, remove, move } = useZFieldArray(form, "sections");

// From context
const { fields, append, remove, move } = useZFieldArray("sections");
```

```tsx
{fields.map((item) => (
  <SectionEditor key={item.id} index={item.index} />
))}
```

Available methods: `append`, `prepend`, `remove`, `insert`, `move`, `swap`, `setValue`.

You can also call array methods directly on the namespace:

```ts
form.fieldArray.append("sections", { title: "" });
form.fieldArray.remove("sections", 2);
form.fieldArray.move("sections", 0, 3);
```

## `FormProvider` + `useFormContext`

Context-based API to avoid prop drilling. Used automatically by `useZField` and `useZFieldArray` when no `form` argument is passed.

```tsx
function App() {
  const form = useZForm<FormValues>({ defaultValues });

  return (
    <FormProvider value={form}>
      <NameField />
      <EmailField />
    </FormProvider>
  );
}

function NameField() {
  const { field, fieldState } = useZField("name");
  // ...
}

function EmailField() {
  const { field, fieldState } = useZField("email", {
    asyncValidate: checkEmail,
    debounce: 500,
  });
  // ...
}
```

You can also call `useFormContext()` directly if you need the form instance:

```tsx
const form = useFormContext();
```

## `form.field.method(path)` — field namespace

Operates on the exact path. No recursion on children. Selectors are cached per path — the same function reference is returned for the same path, so they're safe for zustand subscriptions.

```ts
// Imperative getters
form.field.getValue("email");   // current value
form.field.isDirty("email");    // boolean
form.field.isTouched("email");  // boolean
form.field.getError("email");   // string | undefined
form.field.isPending("email");  // boolean

// Setters (dispatch actions)
form.field.setValue("email", "test@example.com");
form.field.focus("email");
form.field.blur("email");
form.field.validate("email");
form.field.reset("email");

// Cached selectors for form(selector)
const fieldState = form(form.field.select.fieldState("email"), shallow);
const value = form(form.field.select.value("email"));
const error = form(form.field.select.error("email"));
const dirty = form(form.field.select.dirty("email"));
const focused = form(form.field.select.focused("email"));
```

## `form.tree.method(path?)` — tree namespace

Operates on the path and all its descendants. Without arguments, operates on the entire form.

```ts
// Subtree queries
form.tree.isDirty("items");      // any dirty field under items.*
form.tree.isValid("items");      // no errors under items.*
form.tree.getErrors("items");    // all errors under items.*
form.tree.clearErrors("items");  // remove all errors under items.*

// Whole-form queries (no path)
form.tree.isDirty();
form.tree.isValid();

// Cached selectors
const errorCount = form(form.tree.select.errorCount("items"));
const isValid = form(form.tree.select.valid());
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

// Devtools — pass middleware to useZForm
const form = useZForm({
  defaultValues,
  middleware: (init) => devtools(init, { name: "zustand-form" }),
});
// Every action shows up as SET_VALUE:email, BLUR:name, etc.
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

1. **values** — sets values, handles array mutations (append, remove, insert, move, swap)
2. **touched** — marks touched on focus, reindexes on array ops
3. **dirty** — compares against defaultValues with deep equality
4. **validation** — per-field sync validators from registry
5. **schemaValidation** — form-level resolver, skips if field already has error
6. **asyncValidation** — async validators with debounce, version-based stale cancellation, auto-cancel on sync error
7. **pending** — tracks pendingFields lifecycle
8. **submit** — isSubmitting, submitCount, isSubmitSuccessful

You can override the pipeline via the `enhancers` option:

```ts
const form = createForm({
  initialState: { values: defaultValues },
  enhancers: (defaults) => [
    ...defaults,
    { name: 'myEnhancer', enhancer: myCustomEnhancer },
  ],
});
```

## Usage outside React

`createForm` returns a vanilla zustand store — no React required. Use it in Node scripts, server actions, tests, or any framework.

```ts
import { createForm } from "zform";

const form = createForm<FormValues>({
  initialState: { values: { name: "", email: "" } },
  resolver: myResolver,
});

// Full API available
form.field.setValue("email", "test@example.com");
form.field.getValue("email"); // "test@example.com"
form.tree.isValid();          // boolean

// Subscribe to changes
form.subscribe((state) => console.log(state.values));

// Read snapshot
const { values, errors } = form.getState();
```

## License

MIT
