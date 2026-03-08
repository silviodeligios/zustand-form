import type { FormResolver } from "./types";

/** Minimal Standard Schema interface compatible with Zod 4, Valibot, ArkType, etc. */
interface StandardSchemaIssue {
  path?: ReadonlyArray<PropertyKey | { key: PropertyKey }>;
  message: string;
}

interface StandardSchemaResult<T> {
  value?: T;
  issues?: ReadonlyArray<StandardSchemaIssue>;
}

interface StandardSchema<T = unknown> {
  "~standard": {
    version: number;
    validate(
      input: unknown,
    ): StandardSchemaResult<T> | Promise<StandardSchemaResult<T>>;
  };
}

function issuePath(issue: StandardSchemaIssue): string {
  if (!issue.path) return "";
  return issue.path
    .map((seg) =>
      typeof seg === "object" && seg !== null && "key" in seg
        ? seg.key
        : seg,
    )
    .join(".");
}

/** Creates a FormResolver from any Standard Schema (Zod 4, Valibot, ArkType, etc.) */
export function standardSchemaResolver<TValues>(
  schema: StandardSchema<TValues>,
): FormResolver<TValues> {
  return {
    validate(values: TValues): Record<string, string | undefined> {
      const result = schema["~standard"].validate(values);
      // Standard Schema allows async results, but FormResolver.validate is sync.
      // Async schemas should use asyncValidate instead.
      if (result instanceof Promise) return {};
      const errors: Record<string, string | undefined> = {};
      if (result.issues) {
        for (const issue of result.issues) {
          const path = issuePath(issue);
          if (path && !errors[path]) {
            errors[path] = issue.message;
          }
        }
      }
      return errors;
    },
  };
}
