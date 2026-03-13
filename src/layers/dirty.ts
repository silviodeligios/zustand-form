import type { Enhancer, FormState } from "../core/types";
import * as A from "../core/actions";
import { getIn, hasPath } from "../utils/paths";
import { isEqual } from "../utils/compare";
import { treeMatcher } from "../utils/tree";
import { removeByPrefix, keyPathToIndexPath } from "../utils/arrayKeys";

function arrayDirtyCheck<TValues, TError>(
  dirtyFields: Record<string, boolean>,
  draft: Partial<FormState<TValues, TError>>,
  prev: FormState<TValues, TError>,
  path: string,
  defaultValues: TValues,
  initialArrayKeys: Record<string, string[]>,
): Partial<FormState<TValues, TError>> {
  const values = draft.values ?? prev.values;
  const ak = draft.arrayKeys ?? prev.arrayKeys;
  const currentIndexPath = keyPathToIndexPath(path, ak);
  const originalIndexPath = keyPathToIndexPath(path, initialArrayKeys);
  const currentVal = getIn(values, currentIndexPath);
  const initialVal = getIn(defaultValues, originalIndexPath);
  if (!isEqual(currentVal, initialVal)) {
    return { ...draft, dirtyFields: { ...dirtyFields, [path]: true } };
  }
  const { [path]: _, ...rest } = dirtyFields;
  return { ...draft, dirtyFields: rest };
}

export function dirtyEnhancer<TValues, TError = string>(
  defaultValues: TValues,
  initialArrayKeys: Record<string, string[]>,
): Enhancer<TValues, TError> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path) return draft;
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const currentIndexPath = keyPathToIndexPath(ctx.path, ak);
        const originalIndexPath = keyPathToIndexPath(ctx.path, initialArrayKeys);
        const current = getIn(values, currentIndexPath);
        const initial = getIn(defaultValues, originalIndexPath);
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
          draft, prev, ctx.path, defaultValues, initialArrayKeys,
        );
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path) return draft;
        const prevKeys = prev.arrayKeys[ctx.path] ?? [];
        const removedKey = prevKeys[ctx.index!];
        let base = draft.dirtyFields ?? prev.dirtyFields;
        if (removedKey) {
          base = removeByPrefix(base, ctx.path + "." + removedKey);
        }
        return arrayDirtyCheck(
          base, draft, prev, ctx.path, defaultValues, initialArrayKeys,
        );
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path) return draft;
        return arrayDirtyCheck(
          draft.dirtyFields ?? prev.dirtyFields,
          draft, prev, ctx.path, defaultValues, initialArrayKeys,
        );
      }
      case A.ARRAY_MOVE:
      case A.ARRAY_SWAP:
      case A.ARRAY_SORT: {
        if (!ctx.path) return draft;
        return arrayDirtyCheck(
          draft.dirtyFields ?? prev.dirtyFields,
          draft, prev, ctx.path, defaultValues, initialArrayKeys,
        );
      }
      case A.RESET_FORM:
        return { ...draft, dirtyFields: {} };
      case A.RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } =
          draft.dirtyFields ?? prev.dirtyFields;
        return { ...draft, dirtyFields: rest };
      }
      case A.SET_TREE_VALUE: {
        const match = treeMatcher(ctx.path);
        const base = draft.dirtyFields ?? prev.dirtyFields;
        const newValues = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const next: Record<string, boolean> = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            if (base[k] !== undefined) next[k] = base[k];
          } else {
            const idxPath = keyPathToIndexPath(k, ak);
            if (hasPath(newValues, idxPath)) {
              const current = getIn(newValues, idxPath);
              const origIdx = keyPathToIndexPath(k, initialArrayKeys);
              const initial = getIn(defaultValues, origIdx);
              if (!isEqual(current, initial)) next[k] = true;
            }
          }
        }
        return { ...draft, dirtyFields: next };
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
