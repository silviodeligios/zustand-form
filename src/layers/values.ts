import type { Enhancer } from "../core/types";
import * as A from "../core/actions";
import { setIn, getIn, getInArray } from "../utils/paths";
import {
  keyPathToIndexPath,
  scanArrayKeys,
  generateKey,
  removeByPrefix,
} from "../utils/arrayKeys";

/**
 * Remove old arrayKeys under `keyPath`, scan the new value for arrays,
 * and return the merged arrayKeys + updated counter.
 */
function rescanSubtree(
  ak: Record<string, string[]>,
  keyPath: string,
  value: unknown,
  counter: number,
): { arrayKeys: Record<string, string[]>; counter: number } {
  let newAk = removeByPrefix(ak, keyPath);
  if (newAk === ak) newAk = { ...ak };
  const scanned = scanArrayKeys(value, keyPath, counter);
  return {
    arrayKeys: { ...newAk, ...scanned.arrayKeys },
    counter: scanned.nextCounter,
  };
}

export function valuesEnhancer<TValues, TError = string>(
  defaultValues: TValues,
  initialArrayKeys: Record<string, string[]>,
): Enhancer<TValues, TError> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;

        const indexPath = keyPathToIndexPath(ctx.path, ak);
        const newValues = setIn(base, indexPath, ctx.value);

        let newAk = ak;
        if (ctx.value != null && typeof ctx.value === "object") {
          const cleaned = removeByPrefix(ak, ctx.path);
          const scanned = scanArrayKeys(ctx.value, ctx.path, counter);
          if (Object.keys(scanned.arrayKeys).length > 0 || cleaned !== ak) {
            newAk = { ...(cleaned === ak ? ak : cleaned), ...scanned.arrayKeys };
            counter = scanned.nextCounter;
          }
        }

        const result: Partial<typeof prev> = { ...draft, values: newValues };
        if (newAk !== ak) {
          result.arrayKeys = newAk;
          result._keyCounter = counter;
        }
        return result;
      }
      case A.ARRAY_APPEND: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;
        const indexPath = keyPathToIndexPath(ctx.path, ak);

        const arr = [...getInArray(base, indexPath), ctx.value];
        const newValues = setIn(base, indexPath, arr);

        const { key, nextCounter } = generateKey(counter);
        counter = nextCounter;
        const elementKeyPath = ctx.path + "." + key;
        const scanned = scanArrayKeys(ctx.value, elementKeyPath, counter);
        counter = scanned.nextCounter;

        const keys = [...(ak[ctx.path] ?? []), key];
        return {
          ...draft,
          values: newValues,
          arrayKeys: { ...ak, ...scanned.arrayKeys, [ctx.path]: keys },
          _keyCounter: counter,
        };
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const indexPath = keyPathToIndexPath(ctx.path, ak);

        const arr = getInArray(base, indexPath).filter(
          (_, i) => i !== ctx.index,
        );
        const newValues = setIn(base, indexPath, arr);

        const keys = ak[ctx.path] ?? [];
        const removedKey = keys[ctx.index!];
        const newKeys = keys.filter((_, i) => i !== ctx.index);
        let newAk = { ...ak, [ctx.path]: newKeys };
        if (removedKey) {
          newAk = removeByPrefix(newAk, ctx.path + "." + removedKey);
        }

        return { ...draft, values: newValues, arrayKeys: newAk };
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;
        const indexPath = keyPathToIndexPath(ctx.path, ak);

        const arr = [...getInArray(base, indexPath)];
        arr.splice(ctx.index, 0, ctx.value);
        const newValues = setIn(base, indexPath, arr);

        const { key, nextCounter } = generateKey(counter);
        counter = nextCounter;
        const elementKeyPath = ctx.path + "." + key;
        const scanned = scanArrayKeys(ctx.value, elementKeyPath, counter);
        counter = scanned.nextCounter;

        const keys = [...(ak[ctx.path] ?? [])];
        keys.splice(ctx.index, 0, key);
        return {
          ...draft,
          values: newValues,
          arrayKeys: { ...ak, ...scanned.arrayKeys, [ctx.path]: keys },
          _keyCounter: counter,
        };
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const indexPath = keyPathToIndexPath(ctx.path, ak);

        const arr = [...getInArray(base, indexPath)];
        const [item] = arr.splice(ctx.from, 1);
        arr.splice(ctx.to, 0, item);

        const keys = [...(ak[ctx.path] ?? [])];
        const [movedKey] = keys.splice(ctx.from, 1);
        keys.splice(ctx.to, 0, movedKey!);

        return {
          ...draft,
          values: setIn(base, indexPath, arr),
          arrayKeys: { ...ak, [ctx.path]: keys },
        };
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const indexPath = keyPathToIndexPath(ctx.path, ak);

        const arr = [...getInArray(base, indexPath)];
        const tmp = arr[ctx.from];
        arr[ctx.from] = arr[ctx.to];
        arr[ctx.to] = tmp;

        const keys = [...(ak[ctx.path] ?? [])];
        const tmpKey = keys[ctx.from]!;
        keys[ctx.from] = keys[ctx.to]!;
        keys[ctx.to] = tmpKey;

        return {
          ...draft,
          values: setIn(base, indexPath, arr),
          arrayKeys: { ...ak, [ctx.path]: keys },
        };
      }
      case A.ARRAY_SORT: {
        if (!ctx.path || !ctx.permutation) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const indexPath = keyPathToIndexPath(ctx.path, ak);

        const arr = getInArray(base, indexPath);
        const sortedArr = ctx.permutation.map((i) => arr[i]);

        const keys = ak[ctx.path] ?? [];
        const sortedKeys = ctx.permutation.map((i) => keys[i]!);

        return {
          ...draft,
          values: setIn(base, indexPath, sortedArr),
          arrayKeys: { ...ak, [ctx.path]: sortedKeys },
        };
      }
      case A.RESET_FORM: {
        const next = ctx.value
          ? { ...defaultValues, ...(ctx.value as Partial<TValues>) }
          : defaultValues;
        const counter = draft._keyCounter ?? prev._keyCounter;
        const scanned = scanArrayKeys(next, "", counter);
        return {
          ...draft,
          values: next,
          arrayKeys: scanned.arrayKeys,
          _keyCounter: scanned.nextCounter,
        };
      }
      case A.RESET_FIELD: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;

        const originalIndexPath = keyPathToIndexPath(ctx.path, initialArrayKeys);
        const initial = getIn(defaultValues, originalIndexPath);
        const currentIndexPath = keyPathToIndexPath(ctx.path, ak);

        const sub = rescanSubtree(ak, ctx.path, initial, counter);
        counter = sub.counter;

        return {
          ...draft,
          values: setIn(base, currentIndexPath, initial),
          arrayKeys: sub.arrayKeys,
          _keyCounter: counter,
        };
      }
      case A.SET_TREE_VALUE: {
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;

        if (!ctx.path) {
          const scanned = scanArrayKeys(ctx.value, "", counter);
          return {
            ...draft,
            values: ctx.value as TValues,
            arrayKeys: scanned.arrayKeys,
            _keyCounter: scanned.nextCounter,
          };
        }

        const currentIndexPath = keyPathToIndexPath(ctx.path, ak);
        const sub = rescanSubtree(ak, ctx.path, ctx.value, counter);
        counter = sub.counter;

        return {
          ...draft,
          values: setIn(base, currentIndexPath, ctx.value),
          arrayKeys: sub.arrayKeys,
          _keyCounter: counter,
        };
      }
      case A.RESET_BRANCH: {
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;

        if (!ctx.path) {
          const scanned = scanArrayKeys(defaultValues, "", counter);
          return {
            ...draft,
            values: defaultValues,
            arrayKeys: scanned.arrayKeys,
            _keyCounter: scanned.nextCounter,
          };
        }

        const originalIndexPath = keyPathToIndexPath(ctx.path, initialArrayKeys);
        const initial = getIn(defaultValues, originalIndexPath);
        const currentIndexPath = keyPathToIndexPath(ctx.path, ak);

        const sub = rescanSubtree(ak, ctx.path, initial, counter);
        counter = sub.counter;

        return {
          ...draft,
          values: setIn(base, currentIndexPath, initial),
          arrayKeys: sub.arrayKeys,
          _keyCounter: counter,
        };
      }
      default:
        return draft;
    }
  };
}
