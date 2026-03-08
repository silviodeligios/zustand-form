import type { Enhancer, FormState } from "../core/types";
import * as A from "../core/actions";
import { getIn, isEqual, treeMatcher } from "../core/utils";
import { reindexPathKeyedRecord } from "../core/arrayReindex";

function arrayDirtyCheck<TValues, TError>(
  dirtyFields: Record<string, boolean>,
  draft: Partial<FormState<TValues, TError>>,
  prev: FormState<TValues, TError>,
  path: string,
  defaultValues: TValues,
): Partial<FormState<TValues, TError>> {
  const values = draft.values ?? prev.values;
  const current = getIn(values, path);
  const initial = getIn(defaultValues, path);
  if (!isEqual(current, initial)) {
    return { ...draft, dirtyFields: { ...dirtyFields, [path]: true } };
  }
  const { [path]: _, ...rest } = dirtyFields;
  return { ...draft, dirtyFields: rest };
}

export function dirtyEnhancer<TValues, TError = string>(
  defaultValues: TValues,
): Enhancer<TValues, TError> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path) return draft;
        const values = draft.values ?? prev.values;
        const current = getIn(values, ctx.path);
        const initial = getIn(defaultValues, ctx.path);
        const isDirty = !isEqual(current, initial);
        const base = draft.dirtyFields ?? prev.dirtyFields;
        if (isDirty) {
          return { ...draft, dirtyFields: { ...base, [ctx.path]: true } };
        }
        const { [ctx.path]: _, ...rest } = base;
        return { ...draft, dirtyFields: rest };
      }
      case A.SET_DIRTY: {
        if (!ctx.path) return draft;
        const val = ctx.value !== false;
        const base = draft.dirtyFields ?? prev.dirtyFields;
        return { ...draft, dirtyFields: { ...base, [ctx.path]: val } };
      }
      case A.ARRAY_APPEND: {
        if (!ctx.path) return draft;
        return arrayDirtyCheck(
          draft.dirtyFields ?? prev.dirtyFields,
          draft,
          prev,
          ctx.path,
          defaultValues,
        );
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.dirtyFields ?? prev.dirtyFields,
          ctx.path,
          { type: "remove", index: ctx.index! },
        );
        return arrayDirtyCheck(base, draft, prev, ctx.path, defaultValues);
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.dirtyFields ?? prev.dirtyFields,
          ctx.path,
          { type: "insert", index: ctx.index! },
        );
        return arrayDirtyCheck(base, draft, prev, ctx.path, defaultValues);
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.dirtyFields ?? prev.dirtyFields,
          ctx.path,
          { type: "move", from: ctx.from!, to: ctx.to! },
        );
        return arrayDirtyCheck(base, draft, prev, ctx.path, defaultValues);
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.dirtyFields ?? prev.dirtyFields,
          ctx.path,
          { type: "swap", from: ctx.from!, to: ctx.to! },
        );
        return arrayDirtyCheck(base, draft, prev, ctx.path, defaultValues);
      }
      case A.ARRAY_REPLACE: {
        if (!ctx.path) return draft;
        const prefix = ctx.path + ".";
        let base = draft.dirtyFields ?? prev.dirtyFields;
        if (Object.keys(base).some((k) => k.startsWith(prefix))) {
          const next: Record<string, boolean> = {};
          for (const k of Object.keys(base)) {
            if (!k.startsWith(prefix) && base[k] !== undefined)
              next[k] = base[k];
          }
          base = next;
        }
        return arrayDirtyCheck(base, draft, prev, ctx.path, defaultValues);
      }
      case A.RESET_FORM:
        return { ...draft, dirtyFields: {} };
      case A.RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } =
          draft.dirtyFields ?? prev.dirtyFields;
        return { ...draft, dirtyFields: rest };
      }
      case A.RESET_BRANCH: {
        const match = treeMatcher(ctx.path);
        const base = draft.dirtyFields ?? prev.dirtyFields;
        const next: Record<string, boolean> = {};
        for (const k of Object.keys(base)) {
          if (!match(k) && base[k] !== undefined) next[k] = base[k];
        }
        return { ...draft, dirtyFields: next };
      }
      default:
        return draft;
    }
  };
}
