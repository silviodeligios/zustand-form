import type { Enhancer } from "../core/types";
import * as A from "../core/actions";
import { setIn, getIn, getInArray } from "../core/utils";

export function valuesEnhancer<TValues, TError = string>(
  defaultValues: TValues,
): Enhancer<TValues, TError> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        return {
          ...draft,
          values: setIn(base, ctx.path, ctx.value),
        };
      }
      case A.ARRAY_APPEND: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        const arr = getInArray(base, ctx.path);
        return {
          ...draft,
          values: setIn(base, ctx.path, [...arr, ctx.value]),
        };
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = getInArray(base, ctx.path);
        const next = arr.filter((_, i) => i !== ctx.index);
        return { ...draft, values: setIn(base, ctx.path, next) };
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = [...getInArray(base, ctx.path)];
        arr.splice(ctx.index, 0, ctx.value);
        return { ...draft, values: setIn(base, ctx.path, arr) };
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = [...getInArray(base, ctx.path)];
        const [item] = arr.splice(ctx.from, 1);
        arr.splice(ctx.to, 0, item);
        return { ...draft, values: setIn(base, ctx.path, arr) };
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = [...getInArray(base, ctx.path)];
        const tmp = arr[ctx.from];
        arr[ctx.from] = arr[ctx.to];
        arr[ctx.to] = tmp;
        return { ...draft, values: setIn(base, ctx.path, arr) };
      }
      case A.RESET_FORM: {
        const next = ctx.value
          ? { ...defaultValues, ...(ctx.value as Partial<TValues>) }
          : defaultValues;
        return { ...draft, values: next };
      }
      case A.RESET_FIELD: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        const initial = getIn(defaultValues, ctx.path);
        return { ...draft, values: setIn(base, ctx.path, initial) };
      }
      default:
        return draft;
    }
  };
}
