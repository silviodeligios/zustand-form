# zForm

A strongly-typed form library built on [Zustand](https://github.com/pmndrs/zustand) with atomic state updates, built-in async validation, and a pluggable enhancer pipeline. Written in TypeScript from the ground up — paths, values, and errors are fully inferred. Framework-agnostic core; React bindings as a separate entry point.

## Why zForm

I've used [React Hook Form](https://react-hook-form.com/) in every project I've worked on. It's a great library, but over time I kept running into the same walls — limitations that couldn't be worked around without fighting the internals. zForm is my answer to those pain points.

**Multi-tick state updates.** In RHF, `setValue` and `trigger` are separate calls that run in different ticks. If you set a value and immediately read the errors, you get stale data. In zForm, a single `dispatch` runs every enhancer (values, dirty, touched, validation) and commits everything with one `setState`. Value, dirty flags, and errors are all consistent in the same tick.

**Validation that doesn't keep up.** RHF requires an explicit `trigger()` or waits until submit to validate. Sync validation and schema validation in zForm are enhancers in the same pipeline as `setValue` — the error is already in the committed state when subscribers are notified.

**No built-in async validation.** With RHF you have to wire up `setError`/`clearErrors` manually, handle debouncing yourself, and hope stale async results don't overwrite newer errors. zForm has first-class async validation with configurable debounce, version-based stale cancellation, and automatic cancel when a sync error appears while an async check is still in flight.

**Opaque internals.** RHF keeps state in refs and wraps `formState` in a proxy. Debugging means guessing. zForm's form is a plain Zustand store — `getState()`, `subscribe()`, cached selectors, and full devtools support. Every action shows up in the Chrome Zustand devtools panel with a name like `SET_VALUE:email`.

**No real extensibility.** RHF offers resolvers for schema validation, but there's no way to inject custom logic into the state update pipeline. zForm's enhancer pipeline is fully pluggable — you can insert, replace, or reorder enhancers, and your custom logic runs in the same atomic tick as everything else.

**Weak tree operations.** In RHF you can read values by path, but there's no way to query a subtree for errors, dirty fields, or pending validations. zForm provides a `tree` namespace: `form.tree.isDirty("items")`, `form.tree.isValid("items")`, `form.tree.getErrors("items")`, `form.tree.reset("items")` — all operating on a path and every descendant beneath it.

**Array reindexing without session tracking.** Both libraries reindex path-keyed records (errors, touched) when array elements move. But zForm also tracks in-flight async validation sessions — if an element moves from index 2 to index 1 while its async validator is running, the result lands at the correct new path.

| | React Hook Form | zForm |
|---|---|---|
| State updates | `setValue` + `trigger` in separate ticks | Single dispatch, one `setState`, all state consistent |
| Sync validation | Explicit `trigger()` or on submit | Same pipeline as `setValue`, errors in same commit |
| Async validation | Manual `setError`/`clearErrors` | Built-in: debounce, stale cancellation, auto-cancel on sync error |
| Internal state | Refs + proxy `formState` | Zustand store: `getState()`, `subscribe()`, devtools |
| Extensibility | Resolvers only | Pluggable enhancer pipeline |
| Tree operations | `getValues(path)` | `isDirty`, `isValid`, `getErrors`, `reset`, `validate` on any subtree |
| Array reindex | Errors/touched reindexed | + async session path tracking |
| Framework | React only | Vanilla core, React hooks separate |

## Try the demo

```bash
git clone https://github.com/user/zustand-form.git && cd zustand-form
npm install
npm run demo
# opens http://localhost:5173
```

## Architecture

```
React layer
  useForm (callable selector) · useField · useFieldArray · FormProvider

API (vanilla, framework-agnostic)
  form.field.method(path) · form.tree.method(path?) · form-level methods

Action pipeline (dispatch -> enhancers -> setState)
  values · touched · dirty · validation · schemaValidation · asyncValidation · submit

zustand vanilla store
  getState · subscribe · setState · devtools
```

When an action is dispatched, every enhancer runs in order against the same `prev` snapshot. Each enhancer reads what previous layers wrote in the `draft`. At the end, one `store.setState(draft)` commits everything atomically — no intermediate states, one subscription notification, one React render.

## Quick start

```tsx
import { useForm, useField, FormProvider } from "zform/react";
import { devtools } from "zustand/middleware";

function App() {
  const form = useForm<FormValues>({
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

## `useField` — bind a field

Returns `{ field, fieldState }` like React Hook Form's `useController`. Handlers are memoized — child components wrapped in `React.memo` will skip re-renders when only the parent changes.

Both signatures are supported:

```tsx
// Explicit form prop
const { field, fieldState } = useField(form, "name");

// From context (uses FormProvider)
const { field, fieldState } = useField("name");
```

When `form` is not passed, `useField` calls `useFormContext()` internally. If no `FormProvider` is found, it throws.

```tsx
function NameField() {
  const { field, fieldState } = useField("name");

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

`field` includes: `value`, `onChange`, `onBlur`, `onFocus`, `ref` — spread-ready for inputs.

`fieldState` includes: `dirty`, `touched`, `error`, `pending`, `focused`.

When `form.field.focus(path)` is called programmatically, `useField` detects the change and calls `el.focus()` on the bound ref automatically.

## Field-level validation

`useField` accepts sync and async validators as its last argument (with or without the `form` prop):

```tsx
// With explicit form
const { field, fieldState } = useField(form, "email", {
  validate: (v) => (!String(v).includes("@") ? "Must contain @" : undefined),
  asyncValidate: (v) => checkEmailAvailability(v),
  debounce: 500,
});

// From context
const { field, fieldState } = useField("email", {
  validate: (v) => (!String(v).includes("@") ? "Must contain @" : undefined),
  asyncValidate: (v) => checkEmailAvailability(v),
  debounce: 500,
});
```

### Validation order and priority

The pipeline runs in this order: **field-level sync → schema resolver → async**. Priority flows top-down:

1. **Field sync** (`validate`) — runs first. If it returns an error, schema and async are both skipped for this field.
2. **Schema** (`resolver.validate`) — runs if field sync passed. If it returns an error, async is skipped.
3. **Async** (`asyncValidate`) — runs only if both sync and schema passed, and the field is dirty. Sets `pending: true` while in-flight.

When a sync or schema error appears while an async validation is already in-flight, the async is **automatically cancelled**: the pending state is cleared immediately, and the stale async result is discarded when it resolves. This prevents async results from overwriting sync errors.

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `validate` | — | Sync validator: `(value) => TError \| undefined` |
| `validateMode` | `"onChange"` | When sync runs: `"onChange"` or `"onBlur"` |
| `asyncValidate` | — | Async validator: `(value) => Promise<TError \| undefined>` |
| `asyncValidateMode` | `"onChange"` | When async runs: `"onChange"` or `"onBlur"` |
| `debounce` | — | Debounce delay (ms) before async fires |

## `useFieldValidation` — validation without binding

Registers validators for a field without returning `field` or `fieldState`. Useful when you have a custom component that manages its own rendering but still needs to participate in the validation pipeline.

```tsx
// With explicit form
useFieldValidation(form, "email", {
  validate: (v) => (!String(v).includes("@") ? "Must contain @" : undefined),
  asyncValidate: (v) => checkEmailAvailability(v),
  debounce: 500,
});

// From context
useFieldValidation("email", {
  validate: (v) => (!String(v).includes("@") ? "Must contain @" : undefined),
  asyncValidate: (v) => checkEmailAvailability(v),
  debounce: 500,
});
```

Accepts the same options as `useField` (`validate`, `validateMode`, `asyncValidate`, `asyncValidateMode`, `debounce`). Validators are registered on mount and cleaned up on unmount.

## Schema validation (resolver)

A `FormResolver` validates the entire form at once, returning a record of errors keyed by path. It runs after per-field validators — if a field already has an error from its own validator, the resolver's error for that field is skipped.

```ts
const resolver: FormResolver<FormValues> = {
  validate(values) {
    const errors: Record<string, string | undefined> = {};
    if (!values.name?.trim()) errors.name = "Name required";
    if (!values.email?.trim()) errors.email = "Email required";
    return errors;
  },
};

const form = useForm({ defaultValues, resolver, resolverMode: "onChange" });
```

### `standardSchemaResolver` — use any validation library

zForm ships with a resolver that works with any library implementing the [Standard Schema](https://github.com/standard-schema/standard-schema) protocol — Zod, Valibot, ArkType, and others. No adapter per library needed.

```ts
import { standardSchemaResolver } from "zform";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  items: z.array(
    z.object({
      title: z.string().min(1, "Title required"),
    }),
  ),
});

const form = useForm({
  defaultValues,
  resolver: standardSchemaResolver(schema),
  resolverMode: "onChange",
});
```

The resolver reads the `~standard` interface at runtime, so it has **zero dependency** on any specific validation library. Nested path errors (e.g. `items.0.title`) are mapped to dot-notation automatically.

## Arrays

`useFieldArray` returns mutation methods that automatically reindex all path-keyed records (dirty, errors, touched, pending). Each item has a stable `id` for React keys and an `index` for path construction.

Both signatures are supported:

```tsx
// Explicit form prop
const { fields, append, remove, move } = useFieldArray(form, "sections");

// From context
const { fields, append, remove, move } = useFieldArray("sections");
```

```tsx
{fields.map((item) => (
  <SectionEditor key={item.id} index={item.index} />
))}
```

Available methods: `append`, `prepend`, `remove`, `insert`, `move`, `swap`, `replace`.

`replace` replaces the entire array value, clears all child state (dirty, touched, errors, pending), and re-validates only the array path itself (sync + schema + async). Children are not individually validated.

You can also call array methods directly on the namespace:

```ts
form.fieldArray.append("sections", { title: "" });
form.fieldArray.remove("sections", 2);
form.fieldArray.move("sections", 0, 3);
form.fieldArray.replace("sections", [{ title: "New" }]);
```

## `FormProvider` + `useFormContext`

Context-based API to avoid prop drilling. Used automatically by `useField` and `useFieldArray` when no `form` argument is passed.

```tsx
function App() {
  const form = useForm<FormValues>({ defaultValues });

  return (
    <FormProvider value={form}>
      <NameField />
      <EmailField />
    </FormProvider>
  );
}

function NameField() {
  const { field, fieldState } = useField("name");
  // ...
}

function EmailField() {
  const { field, fieldState } = useField("email", {
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
form.field.getError("email");   // TError | undefined
form.field.isPending("email");  // boolean

// Setters (dispatch actions)
form.field.setValue("email", "test@example.com");
form.field.focus("email");
form.field.blur("email");
form.field.validate("email");
form.field.reset("email");

// Cached selectors for form(selector)
const fieldState = form(form.field.select.fieldState("email"), shallow);
const inputProps = form(form.field.select.inputProps("email"), shallow);
const value = form(form.field.select.value("email"));
const error = form(form.field.select.error("email"));
const dirty = form(form.field.select.dirty("email"));
const focused = form(form.field.select.focused("email"));
```

### `inputProps` selector — spread-ready bindings without hooks

For cases where you want to bind an input without the full `useField` hook (no validation registration, no ref-based auto-focus), use the `inputProps` selector directly:

```tsx
import { shallow } from "zustand/shallow";

const props = form(form.field.select.inputProps("email"), shallow);
<input {...props} />
<MyCustomInput {...props} />
```

Returns `{ value, onChange, onBlur, onFocus }` where `value` is reactive and the action callbacks are **stable references** (created once per path). With `shallow` equality, the component only re-renders when `value` changes.

This selector lives on the vanilla core — it works from any framework, not just React.

## `form.tree.method(path?)` — tree namespace

Operates on the path and all its descendants. Without arguments, operates on the entire form.

```ts
// Subtree queries
form.tree.isDirty("items");          // any dirty field under items.*
form.tree.isTouched("items");       // any touched field under items.*
form.tree.isPending("items");       // any pending field under items.*
form.tree.isValid("items");          // no errors under items.*
form.tree.getErrors("items");        // all errors under items.*
form.tree.getDirtyFields("items");   // paths of dirty fields
form.tree.getTouchedFields("items"); // paths of touched fields

// Subtree mutations
form.tree.clearErrors("items");  // remove all errors under items.*
form.tree.reset("items");        // reset values, dirty, touched, errors for subtree
form.tree.validate("items");     // re-run sync + schema + async validation for subtree

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

// Devtools — pass middleware to useForm
const form = useForm({
  defaultValues,
  middleware: (init) => devtools(init, { name: "zustand-form" }),
});
// Every action shows up as SET_VALUE:email, BLUR:name, etc.
```

## Store state

```ts
type FormState<TValues, TError = string> = {
  values: TValues
  dirtyFields: Record<string, boolean>
  touchedFields: Record<string, boolean>
  errors: Record<string, TError | undefined>
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
type Enhancer<TValues, TError = string> = (
  ctx: ActionContext,
  prev: FormState<TValues, TError>,
  draft: Partial<FormState<TValues, TError>>,
) => Partial<FormState<TValues, TError>>
```

The built-in pipeline runs in this order:

1. **values** — sets values, handles array mutations (append, remove, insert, move, swap, replace)
2. **touched** — marks touched on blur, reindexes on array ops
3. **dirty** — compares against defaultValues with deep equality
4. **validation** — per-field sync validators from registry
5. **schemaValidation** — form-level resolver, skips if field already has error
6. **asyncValidation** — async validators with debounce, version-based stale cancellation, auto-cancel on sync error
7. **submit** — isSubmitting, submitCount, isSubmitSuccessful

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

### `disableLayers`

All mutating methods accept an optional `DispatchOptions` to skip specific layers for that dispatch:

```ts
// Set value without triggering validation
form.field.setValue("name", "John", {
  disableLayers: ["validation", "schemaValidation"],
});

// Append to array without dirty tracking
form.fieldArray.append("items", { title: "" }, {
  disableLayers: ["dirty"],
});
```

Layer names match those in the default pipeline: `values`, `touched`, `dirty`, `validation`, `schemaValidation`, `asyncValidation`, `submit`.

## Separate entry points

The core is framework-agnostic. React bindings are a separate import:

```ts
import { createForm } from "zform";                // vanilla core — no React dependency
import { useForm, useField } from "zform/react";   // React hooks
```

This means you can use `zform` in Node scripts, server actions, tests, or future Vue/Solid/Angular adapters without pulling in React.

## Usage outside React

`createForm` returns a vanilla zustand store — no React required.

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
