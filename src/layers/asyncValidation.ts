import type { Enhancer, Dispatch } from '../core/types'
import type { FieldRegistry } from '../validation/registry'
import type { FieldValidatorEntry } from '../validation/types'
import * as A from '../core/actions'
import { getIn } from '../core/utils'

export function asyncValidationEnhancer<TValues>(
  registry: FieldRegistry,
  dispatch: Dispatch,
): Enhancer<TValues> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.SET_VALUE: {
        if (!ctx.path) return draft
        const entry = registry.get(ctx.path)
        if (!entry?.asyncValidate) return draft
        if ((entry.asyncValidateMode ?? 'onChange') !== 'onChange') return draft
        const dirty = (draft.dirtyFields ?? prev.dirtyFields)[ctx.path]
        if (!dirty) return draft
        const errors = draft.errors ?? prev.errors
        if (errors[ctx.path]) return draft
        const value = getIn((draft.values ?? prev.values) as TValues, ctx.path)
        const path = ctx.path
        const pending = { ...(draft.pendingFields ?? prev.pendingFields), [path]: true }
        queueMicrotask(() => runAsync(path, value, entry, dispatch, registry))
        return { ...draft, pendingFields: pending }
      }
      case A.BLUR: {
        if (!ctx.path) return draft
        const entry = registry.get(ctx.path)
        if (!entry?.asyncValidate || entry.asyncValidateMode !== 'onBlur') return draft
        const dirty = (draft.dirtyFields ?? prev.dirtyFields)[ctx.path]
        if (!dirty) return draft
        const errors = draft.errors ?? prev.errors
        if (errors[ctx.path]) return draft
        const value = getIn((draft.values ?? prev.values) as TValues, ctx.path)
        const path = ctx.path
        const pending = { ...(draft.pendingFields ?? prev.pendingFields), [path]: true }
        queueMicrotask(() => runAsync(path, value, entry, dispatch, registry))
        return { ...draft, pendingFields: pending }
      }
      default:
        return draft
    }
  }
}

function runAsync(
  path: string, value: unknown,
  entry: FieldValidatorEntry, dispatch: Dispatch, registry: FieldRegistry,
): void {
  const execute = () => {
    const version = registry.nextVersion(path)
    entry.asyncValidate!(value).then((error) => {
      if (registry.getVersion(path) !== version) return
      dispatch({ type: A.ASYNC_RESOLVE, path, value: error })
    })
  }

  if (entry.debounce && entry.debounce > 0) {
    registry.nextVersion(path)
    registry.setTimer(path, setTimeout(execute, entry.debounce))
  } else {
    execute()
  }
}
