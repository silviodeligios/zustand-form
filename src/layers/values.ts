import type { Enhancer } from "../core/types";
import * as A from "../core/actions";
import { setIn, getIn } from "../core/utils";

export function valuesEnhancer<TValues>(
  defaultValues: TValues,
): Enhancer<TValues> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        return {
          ...draft,
          values: setIn(base, ctx.path, ctx.value) as TValues,
        };
      }
      case A.ARRAY_APPEND: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        const arr = (getIn(base, ctx.path) as unknown[] | undefined) ?? [];
        return {
          ...draft,
          values: setIn(base, ctx.path, [...arr, ctx.value]) as TValues,
        };
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = (getIn(base, ctx.path) as unknown[] | undefined) ?? [];
        const next = arr.filter((_, i) => i !== ctx.index);
        return { ...draft, values: setIn(base, ctx.path, next) as TValues };
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = [
          ...((getIn(base, ctx.path) as unknown[] | undefined) ?? []),
        ];
        arr.splice(ctx.index, 0, ctx.value);
        return { ...draft, values: setIn(base, ctx.path, arr) as TValues };
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = [
          ...((getIn(base, ctx.path) as unknown[] | undefined) ?? []),
        ];
        const [item] = arr.splice(ctx.from, 1);
        arr.splice(ctx.to, 0, item);
        return { ...draft, values: setIn(base, ctx.path, arr) as TValues };
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = [
          ...((getIn(base, ctx.path) as unknown[] | undefined) ?? []),
        ];
        const tmp = arr[ctx.from];
        arr[ctx.from] = arr[ctx.to];
        arr[ctx.to] = tmp;
        return { ...draft, values: setIn(base, ctx.path, arr) as TValues };
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
        return { ...draft, values: setIn(base, ctx.path, initial) as TValues };
      }
      default:
        return draft;
    }
  };
}
